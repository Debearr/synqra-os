create extension if not exists pgcrypto;

create table if not exists public.penny_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_user_id uuid references auth.users(id) on delete set null,
  telegram_user_id text,
  telegram_chat_id text,
  access_state text not null default 'invited',
  subscription_tier text not null default 'none',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint penny_access_state_chk
    check (access_state in ('founder', 'admin', 'invited', 'trial', 'active', 'grace', 'expired', 'revoked')),
  constraint penny_access_identity_chk
    check (subject_user_id is not null or telegram_user_id is not null)
);

create unique index if not exists idx_penny_access_subject_user_unique
  on public.penny_access(subject_user_id)
  where subject_user_id is not null;

create unique index if not exists idx_penny_access_telegram_user_unique
  on public.penny_access(telegram_user_id)
  where telegram_user_id is not null;

create index if not exists idx_penny_access_owner_created
  on public.penny_access(owner_id, created_at desc);

create index if not exists idx_penny_access_owner_state
  on public.penny_access(owner_id, access_state, created_at desc);

create index if not exists idx_penny_access_telegram_chat
  on public.penny_access(telegram_chat_id);

drop trigger if exists trg_penny_access_updated_at on public.penny_access;
create trigger trg_penny_access_updated_at
before update on public.penny_access
for each row
execute function public.set_updated_at_column();

alter table public.penny_access enable row level security;

drop policy if exists penny_access_owner_only on public.penny_access;
create policy penny_access_owner_only
on public.penny_access
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

comment on table public.penny_access is 'Penny founder-owned access control and paid-state mapping.';

