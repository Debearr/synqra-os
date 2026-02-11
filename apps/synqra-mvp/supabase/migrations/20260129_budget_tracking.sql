-- Budget Tracking and Graduated Throttling System
-- Monitors API budget usage and enforces graduated throttling

-- Budget usage tracking (current period)
create table if not exists public.budget_usage (
  id uuid primary key default gen_random_uuid(),
  used numeric not null default 0,
  budget_limit numeric not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- Throttling states enum
do $$
begin
  create type throttling_state as enum (
    'NORMAL',
    'ALERT',
    'CACHE_EXTENDED',
    'D1_DISABLED',
    'STALE_ONLY',
    'HARD_STOP'
  );
exception
  when duplicate_object then null;
end
$$;

-- Budget tracking history (snapshots)
create table if not exists public.budget_tracking (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  usage_percentage numeric not null,
  throttling_state throttling_state not null,
  requests_allowed integer not null default 0,
  requests_throttled integer not null default 0,
  cache_hits integer not null default 0,
  cache_misses integer not null default 0,
  created_at timestamptz default now()
);

-- Admin alerts
create table if not exists public.admin_alerts (
  id uuid primary key default gen_random_uuid(),
  threshold numeric not null,
  state throttling_state not null,
  message text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  triggered_at timestamptz not null default now(),
  acknowledged boolean default false,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz default now()
);

-- Assessment cache (for stale data serving)
create table if not exists public.assessment_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  timeframe text not null check (timeframe in ('H4', 'D1')),
  symbol text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_accessed timestamptz default now()
);

-- Indexes for performance
create index if not exists budget_usage_period_idx on public.budget_usage(period_start, period_end);
create index if not exists budget_tracking_timestamp_idx on public.budget_tracking(timestamp desc);
create index if not exists budget_tracking_state_idx on public.budget_tracking(throttling_state);
create index if not exists admin_alerts_acknowledged_idx on public.admin_alerts(acknowledged, triggered_at desc);
create index if not exists assessment_cache_key_idx on public.assessment_cache(cache_key);
create index if not exists assessment_cache_expires_idx on public.assessment_cache(expires_at);

-- Function to increment budget usage
create or replace function increment_budget_usage(p_cost numeric)
returns void as $$
declare
  v_current_period_id uuid;
begin
  -- Get or create current period
  select id into v_current_period_id
  from public.budget_usage
  where period_start <= now()
    and period_end > now()
  order by period_start desc
  limit 1;

  if v_current_period_id is null then
    -- Create new period (monthly)
    insert into public.budget_usage (
      used,
      budget_limit,
      period_start,
      period_end,
      last_updated
    ) values (
      p_cost,
      100, -- Default limit, should be configured
      date_trunc('month', now()),
      date_trunc('month', now()) + interval '1 month',
      now()
    );
  else
    -- Update existing period
    update public.budget_usage
    set used = used + p_cost,
        last_updated = now()
    where id = v_current_period_id;
  end if;
end;
$$ language plpgsql security definer;

-- Function to get current throttling state
create or replace function get_current_throttling_state()
returns table(
  state throttling_state,
  percentage numeric,
  message text
) as $$
declare
  v_usage numeric;
  v_budget_limit numeric;
  v_percentage numeric;
  v_state throttling_state;
  v_message text;
begin
  -- Get current usage
  select u.used, u.budget_limit
  into v_usage, v_budget_limit
  from public.budget_usage u
  where u.period_start <= now()
    and u.period_end > now()
  order by u.period_start desc
  limit 1;

  -- Default if no data
  if v_usage is null then
    v_usage := 0;
    v_budget_limit := 100;
  end if;

  -- Calculate percentage
  v_percentage := (v_usage / v_budget_limit) * 100;

  -- Determine state
  if v_percentage >= 100 then
    v_state := 'HARD_STOP';
    v_message := 'Service temporarily limited';
  elsif v_percentage >= 95 then
    v_state := 'STALE_ONLY';
    v_message := 'Showing cached data only';
  elsif v_percentage >= 90 then
    v_state := 'D1_DISABLED';
    v_message := 'D1 assessments temporarily unavailable';
  elsif v_percentage >= 80 then
    v_state := 'CACHE_EXTENDED';
    v_message := 'Extended cache TTL active';
  elsif v_percentage >= 70 then
    v_state := 'ALERT';
    v_message := 'Budget alert threshold reached';
  else
    v_state := 'NORMAL';
    v_message := 'Service operating normally';
  end if;

  return query select v_state, v_percentage, v_message;
end;
$$ language plpgsql security definer;

-- Function to get or create cached assessment
create or replace function get_cached_assessment(
  p_cache_key text,
  p_max_age_seconds integer default null
)
returns table(
  data jsonb,
  age_seconds integer,
  is_stale boolean
) as $$
declare
  v_data jsonb;
  v_created_at timestamptz;
  v_age_seconds integer;
  v_is_stale boolean;
begin
  select c.data, c.created_at
  into v_data, v_created_at
  from public.assessment_cache c
  where c.cache_key = p_cache_key
    and (c.expires_at > now() or p_max_age_seconds is null)
  order by c.created_at desc
  limit 1;

  if v_data is null then
    return query select null::jsonb, null::integer, true;
    return;
  end if;

  -- Calculate age
  v_age_seconds := extract(epoch from (now() - v_created_at))::integer;

  -- Determine if stale
  v_is_stale := (p_max_age_seconds is not null and v_age_seconds > p_max_age_seconds);

  -- Update last accessed
  update public.assessment_cache
  set last_accessed = now()
  where cache_key = p_cache_key;

  return query select v_data, v_age_seconds, v_is_stale;
end;
$$ language plpgsql security definer;

-- Function to store cached assessment
create or replace function store_cached_assessment(
  p_cache_key text,
  p_timeframe text,
  p_symbol text,
  p_data jsonb,
  p_ttl_seconds integer
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into public.assessment_cache (
    cache_key,
    timeframe,
    symbol,
    data,
    created_at,
    expires_at
  ) values (
    p_cache_key,
    p_timeframe,
    p_symbol,
    p_data,
    now(),
    now() + (p_ttl_seconds || ' seconds')::interval
  )
  on conflict (cache_key) do update
  set data = excluded.data,
      created_at = excluded.created_at,
      expires_at = excluded.expires_at,
      last_accessed = now()
  returning id into v_id;

  return v_id;
end;
$$ language plpgsql security definer;

-- Function to cleanup expired cache
create or replace function cleanup_expired_cache()
returns integer as $$
declare
  v_deleted integer;
begin
  delete from public.assessment_cache
  where expires_at < now();

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$ language plpgsql security definer;

-- Insert initial budget period
insert into public.budget_usage (used, budget_limit, period_start, period_end)
values (
  0,
  100,
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
)
on conflict do nothing;

-- Comments for documentation
comment on table public.budget_usage is 'Tracks current API budget usage period';
comment on table public.budget_tracking is 'Historical snapshots of budget usage and throttling state';
comment on table public.admin_alerts is 'Admin alerts triggered by throttling state changes';
comment on table public.assessment_cache is 'Cached assessment data for stale data serving';
comment on function increment_budget_usage is 'Increments budget usage by specified cost';
comment on function get_current_throttling_state is 'Returns current throttling state based on budget usage';
comment on function get_cached_assessment is 'Retrieves cached assessment if available';
comment on function store_cached_assessment is 'Stores assessment in cache with TTL';
comment on function cleanup_expired_cache is 'Removes expired cache entries';
