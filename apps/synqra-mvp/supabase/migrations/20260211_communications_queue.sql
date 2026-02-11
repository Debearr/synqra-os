-- Communications queue (gmail/calendar drafts + reminders only)

create extension if not exists pgcrypto;

create table if not exists public.communications_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  recipient text not null,
  subject text,
  body text,
  draft_id text,
  approval_status text not null default 'pending',
  sensitivity_level text not null default 'normal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communications_queue_type_chk check (type in ('email', 'calendar')),
  constraint communications_queue_approval_status_chk
    check (approval_status in ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  constraint communications_queue_sensitivity_level_chk
    check (sensitivity_level in ('low', 'normal', 'high'))
);

create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  refresh_token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists idx_communications_queue_user_id on public.communications_queue(user_id);
create index if not exists idx_communications_queue_approval_status on public.communications_queue(approval_status);
create index if not exists idx_communications_queue_type on public.communications_queue(type);
create index if not exists idx_google_oauth_tokens_user_id on public.google_oauth_tokens(user_id);
