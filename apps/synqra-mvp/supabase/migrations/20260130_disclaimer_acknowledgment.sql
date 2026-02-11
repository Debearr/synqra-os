-- Disclaimer Acknowledgment System
-- Tracks user acknowledgment of AuraFX assessment disclaimers
-- Enforces 90-day re-acknowledgment and 10+ views/24h trigger

-- Disclaimer versions table
create table if not exists public.disclaimer_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  content text not null,
  methodology_content text not null,
  effective_date timestamptz not null default now(),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- User disclaimer acknowledgments
create table if not exists public.user_disclaimer_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  disclaimer_version text not null,
  acknowledged_at timestamptz not null default now(),
  acknowledgment_trigger text not null, -- 'initial', '90_day_expiry', '10_view_threshold', 'version_update'
  created_at timestamptz default now()
);

-- Assessment view tracking (for 10+ views/24h trigger)
create table if not exists public.user_assessment_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  assessment_type text not null, -- 'aurafx_signal', 'multi_timeframe', etc.
  viewed_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists user_disclaimer_ack_user_idx on public.user_disclaimer_acknowledgments(user_id);
create index if not exists user_disclaimer_ack_version_idx on public.user_disclaimer_acknowledgments(disclaimer_version);
create index if not exists user_disclaimer_ack_timestamp_idx on public.user_disclaimer_acknowledgments(acknowledged_at);
create index if not exists user_assessment_views_user_idx on public.user_assessment_views(user_id);
create index if not exists user_assessment_views_timestamp_idx on public.user_assessment_views(viewed_at);

-- Insert initial disclaimer version
insert into public.disclaimer_versions (version, content, methodology_content, effective_date, is_active)
values (
  'v1.0.0',
  'Probabilistic market view — not a trade instruction.',
  '[PLACEHOLDER: Full methodology and limitations content to be provided by legal team]

This assessment represents a historical probability analysis based on technical patterns and confluence factors. It is:

- NOT financial advice or a recommendation
- NOT a trade instruction or execution signal
- NOT a guarantee of future market direction
- NOT suitable as the sole basis for any financial decision

Methodology Limitations:
- Based on historical pattern recognition
- Subject to market regime changes
- Does not account for fundamental factors
- Probabilities are estimates, not certainties
- Past patterns do not guarantee future results

Users must:
- Conduct independent analysis
- Consult qualified financial advisors
- Understand their own risk tolerance
- Never risk capital they cannot afford to lose

[END PLACEHOLDER]',
  now(),
  true
);

-- Function to check if user needs to acknowledge disclaimer
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
begin
  -- Get current active disclaimer version
  select version into v_current_version
  from public.disclaimer_versions
  where is_active = true
  order by effective_date desc
  limit 1;

  -- Get user's last acknowledgment
  select acknowledged_at, disclaimer_version
  into v_last_ack, v_last_version
  from public.user_disclaimer_acknowledgments
  where user_id = p_user_id
  order by acknowledged_at desc
  limit 1;

  -- If never acknowledged, require it
  if v_last_ack is null then
    return query select true, 'initial'::text, null::timestamptz, v_current_version;
    return;
  end if;

  -- Check if version changed
  if v_last_version != v_current_version then
    return query select true, 'version_update'::text, v_last_ack, v_current_version;
    return;
  end if;

  -- Check if 90 days have passed
  v_days_since_ack := extract(day from (now() - v_last_ack));
  if v_days_since_ack >= 90 then
    return query select true, '90_day_expiry'::text, v_last_ack, v_current_version;
    return;
  end if;

  -- Check if 10+ views in last 24 hours (since last acknowledgment)
  select count(*) into v_views_24h
  from public.user_assessment_views
  where user_id = p_user_id
    and viewed_at > v_last_ack
    and viewed_at > (now() - interval '24 hours');

  if v_views_24h >= 10 then
    return query select true, '10_view_threshold'::text, v_last_ack, v_current_version;
    return;
  end if;

  -- No acknowledgment required
  return query select false, 'valid'::text, v_last_ack, v_current_version;
end;
$$ language plpgsql security definer;

-- Function to record assessment view
create or replace function record_assessment_view(
  p_user_id uuid,
  p_assessment_type text
)
returns void as $$
begin
  insert into public.user_assessment_views (user_id, assessment_type, viewed_at)
  values (p_user_id, p_assessment_type, now());
end;
$$ language plpgsql security definer;

-- Function to record disclaimer acknowledgment
create or replace function record_disclaimer_acknowledgment(
  p_user_id uuid,
  p_disclaimer_version text,
  p_trigger text
)
returns uuid as $$
declare
  v_ack_id uuid;
begin
  insert into public.user_disclaimer_acknowledgments (
    user_id,
    disclaimer_version,
    acknowledgment_trigger,
    acknowledged_at
  )
  values (p_user_id, p_disclaimer_version, p_trigger, now())
  returning id into v_ack_id;

  return v_ack_id;
end;
$$ language plpgsql security definer;

-- Cleanup old view records (keep only last 30 days)
create or replace function cleanup_old_assessment_views()
returns void as $$
begin
  delete from public.user_assessment_views
  where viewed_at < (now() - interval '30 days');
end;
$$ language plpgsql security definer;

-- Comments for documentation
comment on table public.disclaimer_versions is 'Stores disclaimer versions with content and effective dates';
comment on table public.user_disclaimer_acknowledgments is 'Tracks when users acknowledge disclaimers';
comment on table public.user_assessment_views is 'Tracks assessment views for 10+ views/24h trigger';
comment on function check_disclaimer_acknowledgment_required is 'Checks if user needs to acknowledge disclaimer based on 90-day rule or 10+ views';
comment on function record_assessment_view is 'Records an assessment view for tracking';
comment on function record_disclaimer_acknowledgment is 'Records user disclaimer acknowledgment';
