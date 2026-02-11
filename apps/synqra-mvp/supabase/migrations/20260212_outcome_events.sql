-- Outcome events + daily audit summary (idempotent)

create extension if not exists pgcrypto;

create table if not exists public.outcome_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid,
  event_type text not null,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  platform text,
  outcome_classification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outcome_audit_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_date date not null,
  platform text,
  event_type text not null,
  pass_count integer not null default 0,
  fail_count integer not null default 0,
  fail_reasons jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, summary_date, platform, event_type)
);

create index if not exists idx_outcome_events_user_id on public.outcome_events(user_id);
create index if not exists idx_outcome_events_status on public.outcome_events(status);
create index if not exists idx_outcome_events_job_id on public.outcome_events(job_id);
create index if not exists idx_outcome_events_created_at on public.outcome_events(created_at desc);

create index if not exists idx_outcome_audit_summary_user_id on public.outcome_audit_summary(user_id);
create index if not exists idx_outcome_audit_summary_date on public.outcome_audit_summary(summary_date desc);
