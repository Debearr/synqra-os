create extension if not exists pgcrypto;

create table if not exists public.penny_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  details text,
  status text not null default 'open',
  priority text not null default 'normal',
  source text not null default 'manual',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint penny_tasks_status_chk
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  constraint penny_tasks_priority_chk
    check (priority in ('low', 'normal', 'high'))
);

create table if not exists public.penny_reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.penny_tasks(id) on delete set null,
  reminder_text text not null,
  remind_at timestamptz not null,
  status text not null default 'pending',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint penny_reminders_status_chk
    check (status in ('pending', 'done', 'cancelled'))
);

create table if not exists public.penny_memory_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null,
  title text not null,
  content text not null,
  source text not null default 'manual',
  confidence numeric(4, 3) not null default 1.000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint penny_memory_entries_confidence_chk
    check (confidence >= 0 and confidence <= 1)
);

create index if not exists idx_penny_tasks_owner_created
  on public.penny_tasks(owner_id, created_at desc);

create index if not exists idx_penny_tasks_owner_status_due
  on public.penny_tasks(owner_id, status, due_at);

create index if not exists idx_penny_reminders_owner_remind_at
  on public.penny_reminders(owner_id, remind_at);

create index if not exists idx_penny_reminders_owner_status
  on public.penny_reminders(owner_id, status, remind_at);

create index if not exists idx_penny_memory_entries_owner_created
  on public.penny_memory_entries(owner_id, created_at desc);

create index if not exists idx_penny_memory_entries_owner_type
  on public.penny_memory_entries(owner_id, entry_type, created_at desc);

drop trigger if exists trg_penny_tasks_updated_at on public.penny_tasks;
create trigger trg_penny_tasks_updated_at
before update on public.penny_tasks
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_penny_reminders_updated_at on public.penny_reminders;
create trigger trg_penny_reminders_updated_at
before update on public.penny_reminders
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_penny_memory_entries_updated_at on public.penny_memory_entries;
create trigger trg_penny_memory_entries_updated_at
before update on public.penny_memory_entries
for each row
execute function public.set_updated_at_column();

alter table public.penny_tasks enable row level security;
alter table public.penny_reminders enable row level security;
alter table public.penny_memory_entries enable row level security;

drop policy if exists penny_tasks_owner_only on public.penny_tasks;
create policy penny_tasks_owner_only
on public.penny_tasks
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists penny_reminders_owner_only on public.penny_reminders;
create policy penny_reminders_owner_only
on public.penny_reminders
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists penny_memory_entries_owner_only on public.penny_memory_entries;
create policy penny_memory_entries_owner_only
on public.penny_memory_entries
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

comment on table public.penny_tasks is 'Penny founder-only task state.';
comment on table public.penny_reminders is 'Penny founder-only reminder state.';
comment on table public.penny_memory_entries is 'Penny founder-only structured durable memory entries.';
