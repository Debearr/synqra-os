-- Background job run ledger

create extension if not exists pgcrypto;

create table if not exists public.background_job_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  scheduled_time timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_log text,
  retry_count integer not null default 0,
  next_retry_at timestamptz,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint background_job_runs_status_chk
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

create index if not exists idx_background_job_runs_user_id on public.background_job_runs(user_id);
create index if not exists idx_background_job_runs_status on public.background_job_runs(status);
create index if not exists idx_background_job_runs_scheduled_time on public.background_job_runs(scheduled_time);
create index if not exists idx_background_job_runs_idempotency on public.background_job_runs(idempotency_key);
create index if not exists idx_background_job_runs_retry on public.background_job_runs(retry_count, next_retry_at);
