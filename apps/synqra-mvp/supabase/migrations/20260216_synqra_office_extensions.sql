-- Synqra Office additive schema extensions (thin delegation layer support)

create extension if not exists pgcrypto;

-- Multi-tenant configs
create table if not exists public.product_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text unique not null,
  tenant_name text not null,
  brand_voice jsonb not null default '{}'::jsonb,
  platform_rules jsonb,
  content_guidelines text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Content request tracking (delegates generation to /api/council)
create table if not exists public.content_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.product_configs(tenant_id),
  user_id uuid references auth.users(id),
  request_type text not null,
  prompt_input text not null,
  generated_output text,
  quality_score numeric(3, 2),
  governance_warnings jsonb not null default '[]'::jsonb,
  platform text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_requests_tenant on public.content_requests(tenant_id, created_at desc);
create index if not exists idx_content_requests_user on public.content_requests(user_id, created_at desc);

-- Email classification events
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  gmail_message_id text not null unique,
  gmail_thread_id text,
  from_address text not null,
  to_address text,
  subject text not null,
  body_preview text,
  received_at timestamptz,
  priority text not null default 'normal',
  email_type text not null default 'transactional',
  suggested_labels jsonb not null default '[]'::jsonb,
  requires_signature boolean not null default false,
  sentiment text not null default 'neutral',
  classified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_events_user on public.email_events(user_id, created_at desc);
create index if not exists idx_email_events_priority on public.email_events(priority, created_at desc);

-- Draft artifacts (draft-only, no send path)
create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  email_event_id uuid references public.email_events(id) on delete cascade,
  user_id uuid references auth.users(id),
  recipient text not null,
  subject text not null,
  body text not null,
  tone_preference text not null default 'direct',
  approval_status text not null default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  gmail_draft_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_drafts_approval_status_chk check (approval_status in ('pending', 'approved', 'rejected', 'cancelled'))
);

create index if not exists idx_email_drafts_user on public.email_drafts(user_id, created_at desc);
create index if not exists idx_email_drafts_approval on public.email_drafts(approval_status, created_at desc);

-- Email voice training examples
create table if not exists public.email_voice_training (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  example_type text not null,
  original_text text not null,
  tone text not null,
  context text,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_voice_training_user on public.email_voice_training(user_id, created_at desc);
create index if not exists idx_email_voice_training_tone on public.email_voice_training(user_id, tone);

-- updated_at triggers
drop trigger if exists trg_product_configs_updated_at on public.product_configs;
create trigger trg_product_configs_updated_at
before update on public.product_configs
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_content_requests_updated_at on public.content_requests;
create trigger trg_content_requests_updated_at
before update on public.content_requests
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_email_events_updated_at on public.email_events;
create trigger trg_email_events_updated_at
before update on public.email_events
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_email_drafts_updated_at on public.email_drafts;
create trigger trg_email_drafts_updated_at
before update on public.email_drafts
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_email_voice_training_updated_at on public.email_voice_training;
create trigger trg_email_voice_training_updated_at
before update on public.email_voice_training
for each row
execute function public.set_updated_at_column();

-- RLS
alter table public.product_configs enable row level security;
alter table public.content_requests enable row level security;
alter table public.email_events enable row level security;
alter table public.email_drafts enable row level security;
alter table public.email_voice_training enable row level security;

drop policy if exists product_configs_service on public.product_configs;
create policy product_configs_service
on public.product_configs
for all
to service_role
using (true)
with check (true);

drop policy if exists product_configs_read_authenticated on public.product_configs;
create policy product_configs_read_authenticated
on public.product_configs
for select
to authenticated
using (active = true);

drop policy if exists content_requests_user on public.content_requests;
create policy content_requests_user
on public.content_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists content_requests_service on public.content_requests;
create policy content_requests_service
on public.content_requests
for all
to service_role
using (true)
with check (true);

drop policy if exists email_events_user on public.email_events;
create policy email_events_user
on public.email_events
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists email_events_service on public.email_events;
create policy email_events_service
on public.email_events
for all
to service_role
using (true)
with check (true);

drop policy if exists email_drafts_user on public.email_drafts;
create policy email_drafts_user
on public.email_drafts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists email_drafts_service on public.email_drafts;
create policy email_drafts_service
on public.email_drafts
for all
to service_role
using (true)
with check (true);

drop policy if exists email_voice_user on public.email_voice_training;
create policy email_voice_user
on public.email_voice_training
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists email_voice_service on public.email_voice_training;
create policy email_voice_service
on public.email_voice_training
for all
to service_role
using (true)
with check (true);

-- Seed first tenant
insert into public.product_configs (tenant_id, tenant_name, brand_voice, active)
values (
  'synqra-marketing',
  'Synqra Marketing',
  '{
    "tone": "premium",
    "keywords": ["deterministic", "governance", "human-in-control", "quiet luxury"],
    "avoid": ["game-changer", "revolutionize", "emojis", "hashtags"],
    "voice_notes": "Technical precision with understated confidence. No hype."
  }'::jsonb,
  true
)
on conflict (tenant_id) do nothing;

comment on table public.product_configs is 'Synqra Office: Multi-tenant brand voice configs';
comment on table public.content_requests is 'Synqra Office: Unified content generation tracking';
comment on table public.email_events is 'Synqra Office: Classified inbound email events';
comment on table public.email_drafts is 'Synqra Office: Draft-only outbound replies pending approval';
comment on table public.email_voice_training is 'Synqra Office: Founder voice training examples';

