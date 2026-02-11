-- Owner fields + RLS policies

alter table public.ai_call_logs
  add column if not exists owner_id uuid;

alter table public.budget_tracking
  add column if not exists owner_id uuid;

alter table public.budget_tracking
  add column if not exists cost_usd numeric default 0;

alter table public.agent_traceability
  add column if not exists owner_id uuid;

alter table public.reasoning_snapshots
  add column if not exists owner_id uuid;

alter table public.agent_version_registry
  add column if not exists owner_id uuid;

alter table public.prompt_version_registry
  add column if not exists owner_id uuid;

alter table public.disclaimer_versions
  add column if not exists owner_id uuid;

alter table public.user_disclaimer_acknowledgments
  add column if not exists owner_id uuid;

alter table public.user_assessment_views
  add column if not exists owner_id uuid;

alter table public.aura_signals
  add column if not exists owner_id uuid;

alter table public.aura_signal_history
  add column if not exists owner_id uuid;

alter table public.posting_jobs
  add column if not exists owner_id uuid;

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  rating integer not null,
  comment text,
  owner_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_ai_feedback_owner on public.ai_feedback(owner_id);
create index if not exists idx_ai_feedback_request on public.ai_feedback(request_id);

-- Enable RLS
alter table public.ai_call_logs enable row level security;
alter table public.budget_tracking enable row level security;
alter table public.agent_traceability enable row level security;
alter table public.reasoning_snapshots enable row level security;
alter table public.agent_version_registry enable row level security;
alter table public.prompt_version_registry enable row level security;
alter table public.disclaimer_versions enable row level security;
alter table public.user_disclaimer_acknowledgments enable row level security;
alter table public.user_assessment_views enable row level security;
alter table public.aura_signals enable row level security;
alter table public.aura_signal_history enable row level security;
alter table public.posting_jobs enable row level security;
alter table public.ai_feedback enable row level security;

-- Policies

drop policy if exists ai_call_logs_owner_access on public.ai_call_logs;
create policy ai_call_logs_owner_access on public.ai_call_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists ai_call_logs_service_access on public.ai_call_logs;
create policy ai_call_logs_service_access on public.ai_call_logs
  for all to service_role using (true) with check (true);


drop policy if exists budget_tracking_owner_access on public.budget_tracking;
create policy budget_tracking_owner_access on public.budget_tracking
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists budget_tracking_service_access on public.budget_tracking;
create policy budget_tracking_service_access on public.budget_tracking
  for all to service_role using (true) with check (true);


drop policy if exists agent_traceability_owner_access on public.agent_traceability;
create policy agent_traceability_owner_access on public.agent_traceability
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists agent_traceability_service_access on public.agent_traceability;
create policy agent_traceability_service_access on public.agent_traceability
  for all to service_role using (true) with check (true);


drop policy if exists reasoning_snapshots_owner_access on public.reasoning_snapshots;
create policy reasoning_snapshots_owner_access on public.reasoning_snapshots
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists reasoning_snapshots_service_access on public.reasoning_snapshots;
create policy reasoning_snapshots_service_access on public.reasoning_snapshots
  for all to service_role using (true) with check (true);


drop policy if exists agent_version_registry_owner_access on public.agent_version_registry;
create policy agent_version_registry_owner_access on public.agent_version_registry
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists agent_version_registry_service_access on public.agent_version_registry;
create policy agent_version_registry_service_access on public.agent_version_registry
  for all to service_role using (true) with check (true);


drop policy if exists prompt_version_registry_owner_access on public.prompt_version_registry;
create policy prompt_version_registry_owner_access on public.prompt_version_registry
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists prompt_version_registry_service_access on public.prompt_version_registry;
create policy prompt_version_registry_service_access on public.prompt_version_registry
  for all to service_role using (true) with check (true);


drop policy if exists disclaimer_versions_owner_access on public.disclaimer_versions;
create policy disclaimer_versions_owner_access on public.disclaimer_versions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists disclaimer_versions_read on public.disclaimer_versions;
create policy disclaimer_versions_read on public.disclaimer_versions
  for select to authenticated using (true);

drop policy if exists disclaimer_versions_service_access on public.disclaimer_versions;
create policy disclaimer_versions_service_access on public.disclaimer_versions
  for all to service_role using (true) with check (true);


drop policy if exists user_disclaimer_acknowledgments_owner_access on public.user_disclaimer_acknowledgments;
create policy user_disclaimer_acknowledgments_owner_access on public.user_disclaimer_acknowledgments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists user_disclaimer_acknowledgments_service_access on public.user_disclaimer_acknowledgments;
create policy user_disclaimer_acknowledgments_service_access on public.user_disclaimer_acknowledgments
  for all to service_role using (true) with check (true);


drop policy if exists user_assessment_views_owner_access on public.user_assessment_views;
create policy user_assessment_views_owner_access on public.user_assessment_views
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists user_assessment_views_service_access on public.user_assessment_views;
create policy user_assessment_views_service_access on public.user_assessment_views
  for all to service_role using (true) with check (true);


drop policy if exists aura_signals_owner_access on public.aura_signals;
create policy aura_signals_owner_access on public.aura_signals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists aura_signals_service_access on public.aura_signals;
create policy aura_signals_service_access on public.aura_signals
  for all to service_role using (true) with check (true);


drop policy if exists aura_signal_history_owner_access on public.aura_signal_history;
create policy aura_signal_history_owner_access on public.aura_signal_history
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists aura_signal_history_service_access on public.aura_signal_history;
create policy aura_signal_history_service_access on public.aura_signal_history
  for all to service_role using (true) with check (true);


drop policy if exists posting_jobs_owner_access on public.posting_jobs;
create policy posting_jobs_owner_access on public.posting_jobs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists posting_jobs_service_access on public.posting_jobs;
create policy posting_jobs_service_access on public.posting_jobs
  for all to service_role using (true) with check (true);


drop policy if exists ai_feedback_owner_access on public.ai_feedback;
create policy ai_feedback_owner_access on public.ai_feedback
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists ai_feedback_service_access on public.ai_feedback;
create policy ai_feedback_service_access on public.ai_feedback
  for all to service_role using (true) with check (true);

-- Traceability functions: switch to security invoker + enforce owner context

create or replace function create_agent_traceability_record(
  p_assessment_id text,
  p_assessment_schema_version text,
  p_agents jsonb,
  p_primary_agent jsonb,
  p_prompt jsonb,
  p_reasoning_chain jsonb,
  p_context_used jsonb,
  p_total_tokens integer,
  p_model_used text,
  p_temperature numeric
)
returns uuid as $$
declare
  v_reasoning_id uuid;
  v_traceability_id uuid;
  v_size_bytes integer;
  v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null then
    raise exception 'Unauthorized';
  end if;

  v_size_bytes := octet_length(p_reasoning_chain::text) + octet_length(p_context_used::text);

  insert into public.reasoning_snapshots (
    assessment_id,
    reasoning_chain,
    context_used,
    total_tokens,
    model_used,
    temperature,
    size_bytes,
    owner_id
  ) values (
    p_assessment_id,
    p_reasoning_chain,
    p_context_used,
    p_total_tokens,
    p_model_used,
    p_temperature,
    v_size_bytes,
    v_owner_id
  ) returning id into v_reasoning_id;

  insert into public.agent_traceability (
    assessment_id,
    assessment_schema_version,
    agents,
    primary_agent,
    prompt,
    reasoning_snapshot_id,
    owner_id
  ) values (
    p_assessment_id,
    p_assessment_schema_version,
    p_agents,
    p_primary_agent,
    p_prompt,
    v_reasoning_id,
    v_owner_id
  ) returning id into v_traceability_id;

  return v_traceability_id;
end;
$$ language plpgsql security invoker;

create or replace function get_agent_attribution(p_assessment_id text)
returns table(
  agent_count integer,
  primary_agent_name text,
  version text,
  generated_at timestamptz
) as $$
begin
  return query
  select
    jsonb_array_length(t.agents) as agent_count,
    t.primary_agent->>'name' as primary_agent_name,
    t.primary_agent->>'version' as version,
    t.created_at as generated_at
  from public.agent_traceability t
  where t.assessment_id = p_assessment_id
    and t.owner_id = auth.uid()
  limit 1;
end;
$$ language plpgsql security invoker;

create or replace function query_agent_audit_logs(
  p_assessment_id text default null,
  p_agent_name text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_limit integer default 100
)
returns table(
  id uuid,
  assessment_id text,
  assessment_schema_version text,
  agents jsonb,
  primary_agent jsonb,
  prompt jsonb,
  reasoning_snapshot_id uuid,
  created_at timestamptz
) as $$
begin
  return query
  select
    t.id,
    t.assessment_id,
    t.assessment_schema_version,
    t.agents,
    t.primary_agent,
    t.prompt,
    t.reasoning_snapshot_id,
    t.created_at
  from public.agent_traceability t
  where
    t.owner_id = auth.uid()
    and (p_assessment_id is null or t.assessment_id = p_assessment_id)
    and (p_agent_name is null or t.primary_agent->>'name' = p_agent_name)
    and (p_date_from is null or t.created_at >= p_date_from)
    and (p_date_to is null or t.created_at <= p_date_to)
  order by t.created_at desc
  limit p_limit;
end;
$$ language plpgsql security invoker;

create or replace function get_reasoning_snapshot(p_snapshot_id uuid)
returns table(
  id uuid,
  assessment_id text,
  reasoning_chain jsonb,
  context_used jsonb,
  total_tokens integer,
  model_used text,
  temperature numeric,
  size_bytes integer,
  created_at timestamptz
) as $$
begin
  return query
  select
    r.id,
    r.assessment_id,
    r.reasoning_chain,
    r.context_used,
    r.total_tokens,
    r.model_used,
    r.temperature,
    r.size_bytes,
    r.created_at
  from public.reasoning_snapshots r
  where r.id = p_snapshot_id
    and r.owner_id = auth.uid();
end;
$$ language plpgsql security invoker;

create or replace function register_agent_version(
  p_agent_name text,
  p_version text,
  p_role agent_role,
  p_capabilities text[],
  p_model_used text
)
returns uuid as $$
declare
  v_id uuid;
  v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.agent_version_registry (
    agent_name,
    version,
    role,
    capabilities,
    model_used,
    owner_id
  ) values (
    p_agent_name,
    p_version,
    p_role,
    p_capabilities,
    p_model_used,
    v_owner_id
  )
  on conflict (agent_name, version) do update
  set capabilities = excluded.capabilities,
      model_used = excluded.model_used,
      owner_id = excluded.owner_id
  returning id into v_id;

  return v_id;
end;
$$ language plpgsql security invoker;

create or replace function register_prompt_version(
  p_version_hash text,
  p_template_name text,
  p_template_content text,
  p_parameters_schema jsonb
)
returns uuid as $$
declare
  v_id uuid;
  v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.prompt_version_registry (
    version_hash,
    template_name,
    template_content,
    parameters_schema,
    owner_id
  ) values (
    p_version_hash,
    p_template_name,
    p_template_content,
    p_parameters_schema,
    v_owner_id
  )
  on conflict (version_hash) do nothing
  returning id into v_id;

  return v_id;
end;
$$ language plpgsql security invoker;

-- Disclaimer functions: enforce auth and owner_id

create or replace function check_disclaimer_acknowledgment_required(p_user_id uuid)
returns table(
  required boolean,
  reason text,
  last_acknowledgment timestamptz,
  current_version text
) as $$
declare
  v_last_ack timestamptz;
  v_last_version text;
  v_current_version text;
  v_views_24h integer;
  v_days_since_ack integer;
  v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null or p_user_id != v_owner_id then
    raise exception 'Unauthorized';
  end if;

  select version into v_current_version
  from public.disclaimer_versions
  where is_active = true
  order by effective_date desc
  limit 1;

  select acknowledged_at, disclaimer_version
  into v_last_ack, v_last_version
  from public.user_disclaimer_acknowledgments
  where user_id = p_user_id
  order by acknowledged_at desc
  limit 1;

  if v_last_ack is null then
    return query select true, 'initial'::text, null::timestamptz, v_current_version;
    return;
  end if;

  if v_last_version != v_current_version then
    return query select true, 'version_update'::text, v_last_ack, v_current_version;
    return;
  end if;

  v_days_since_ack := extract(day from (now() - v_last_ack));
  if v_days_since_ack >= 90 then
    return query select true, '90_day_expiry'::text, v_last_ack, v_current_version;
    return;
  end if;

  select count(*) into v_views_24h
  from public.user_assessment_views
  where user_id = p_user_id
    and viewed_at > v_last_ack
    and viewed_at > (now() - interval '24 hours');

  if v_views_24h >= 10 then
    return query select true, '10_view_threshold'::text, v_last_ack, v_current_version;
    return;
  end if;

  return query select false, 'valid'::text, v_last_ack, v_current_version;
end;
$$ language plpgsql security invoker;

create or replace function record_assessment_view(
  p_user_id uuid,
  p_assessment_type text
)
returns void as $$
declare
  v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null or p_user_id != v_owner_id then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_assessment_views (user_id, assessment_type, viewed_at, owner_id)
  values (p_user_id, p_assessment_type, now(), v_owner_id);
end;
$$ language plpgsql security invoker;

create or replace function record_disclaimer_acknowledgment(
  p_user_id uuid,
  p_disclaimer_version text,
  p_trigger text
)
returns uuid as $$
declare
  v_ack_id uuid;
  v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null or p_user_id != v_owner_id then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_disclaimer_acknowledgments (
    user_id,
    disclaimer_version,
    acknowledgment_trigger,
    acknowledged_at,
    owner_id
  )
  values (p_user_id, p_disclaimer_version, p_trigger, now(), v_owner_id)
  returning id into v_ack_id;

  return v_ack_id;
end;
$$ language plpgsql security invoker;

create or replace function cleanup_old_assessment_views()
returns void as $$
begin
  delete from public.user_assessment_views
  where viewed_at < (now() - interval '30 days')
    and owner_id = auth.uid();
end;
$$ language plpgsql security invoker;

-- Budget tracking functions: switch to security invoker

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
      100,
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
$$ language plpgsql security invoker;

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
$$ language plpgsql security invoker;

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
$$ language plpgsql security invoker;

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
$$ language plpgsql security invoker;

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
$$ language plpgsql security invoker;
