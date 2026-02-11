-- Scheduling requests (optional, post-generation only)

create extension if not exists pgcrypto;

create table if not exists public.scheduling_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  platform text not null,
  scheduled_time timestamptz not null,
  approval_status text not null default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduling_requests_approval_status_chk
    check (approval_status in ('pending', 'approved', 'rejected', 'cancelled', 'completed'))
);

create index if not exists idx_scheduling_requests_user_id on public.scheduling_requests(user_id);
create index if not exists idx_scheduling_requests_approval_status on public.scheduling_requests(approval_status);
create index if not exists idx_scheduling_requests_scheduled_time on public.scheduling_requests(scheduled_time);
create index if not exists idx_scheduling_requests_platform on public.scheduling_requests(platform);
