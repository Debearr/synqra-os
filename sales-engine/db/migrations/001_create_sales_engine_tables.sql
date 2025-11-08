-- Autonomous Sales Engine core tables

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text unique,
  phone text,
  company text,
  website text,
  source text default 'unknown',
  status text default 'new',
  context text,
  telegram_handle text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_status_idx on public.leads (status);

create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  score numeric check (score between 0 and 100),
  tier text,
  rationale text,
  recommended_next_step text,
  ai_model text,
  ai_session_id text,
  updated_at timestamptz default now()
);

create index if not exists lead_scores_lead_id_idx on public.lead_scores (lead_id);

create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor text,
  summary text,
  tags text[],
  created_at timestamptz default now()
);

create index if not exists user_memory_user_id_idx on public.user_memory (user_id);

create table if not exists public.sales_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  user_id uuid,
  event_type text,
  payload jsonb default '{}',
  recorded_at timestamptz default now()
);

create index if not exists sales_events_lead_id_idx on public.sales_events (lead_id);
create index if not exists sales_events_event_type_idx on public.sales_events (event_type);

create table if not exists public.system_cache (
  key text primary key,
  value jsonb not null,
  scope text default 'system',
  expires_at timestamptz default now() + interval '1 hour',
  updated_at timestamptz default now()
);

create table if not exists public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  model text,
  prompt text,
  response text,
  created_at timestamptz default now()
);

create or replace function public.refresh_lead_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.refresh_lead_updated_at();
