create table if not exists public.posting_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  platform text not null,
  status text not null,
  response jsonb,
  external_id text,
  idempotency_key text unique,
  error_message text,
  created_at timestamptz default now()
);

alter table public.posting_logs
  add column if not exists idempotency_key text;

alter table public.posting_logs
  add column if not exists error_message text;

create unique index if not exists idx_posting_logs_idempotency
  on public.posting_logs(idempotency_key);
