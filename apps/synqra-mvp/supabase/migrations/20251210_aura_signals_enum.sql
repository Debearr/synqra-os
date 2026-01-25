create type if not exists aura_signal_status as enum ('open', 'tp1', 'tp2', 'tp3', 'closed', 'stopped');

create table if not exists public.aura_signals (
  id uuid primary key default gen_random_uuid(),
  pair text not null,
  style text not null,
  direction text not null,
  entry text not null,
  stop text not null,
  tp1 text,
  tp2 text,
  tp3 text,
  reason text,
  status aura_signal_status default 'open',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.aura_signal_history (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.aura_signals(id) on delete cascade,
  status aura_signal_status not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists aura_signals_pair_idx on public.aura_signals(pair);
create index if not exists aura_signal_history_signal_idx on public.aura_signal_history(signal_id);
