do $$
begin
  create type posting_job_status as enum ('pending', 'processing', 'completed', 'failed');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.posting_jobs (
  job_id uuid primary key default gen_random_uuid(),
  status posting_job_status not null default 'pending',
  payload jsonb not null,
  idempotency_key text not null unique,
  retry_count integer not null default 0,
  owner_id uuid,
  processing_started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posting_jobs_status on public.posting_jobs(status, created_at);
create index if not exists idx_posting_jobs_owner on public.posting_jobs(owner_id);

create or replace function claim_posting_jobs(p_limit integer default 5)
returns setof public.posting_jobs
language plpgsql
as $$
begin
  return query
  with candidates as (
    select job_id
    from public.posting_jobs
    where status = 'pending'
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update public.posting_jobs p
  set status = 'processing',
      processing_started_at = now(),
      updated_at = now()
  from candidates
  where p.job_id = candidates.job_id
  returning p.*;
end;
$$;
