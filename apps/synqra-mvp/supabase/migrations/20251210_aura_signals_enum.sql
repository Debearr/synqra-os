-- Assessment Calibration Status: Historical outcome tracking for directional assessments
-- UNRESOLVED: Assessment not yet resolved
-- PARTIAL_RESOLUTION_1/2/3: Partial directional confirmation at calibration points
-- RESOLVED_AS_ASSESSED: Direction resolved as initially assessed
-- RESOLVED_CONTRARY: Direction resolved contrary to initial assessment
create type if not exists aura_signal_status as enum ('UNRESOLVED', 'PARTIAL_RESOLUTION_1', 'PARTIAL_RESOLUTION_2', 'PARTIAL_RESOLUTION_3', 'RESOLVED_AS_ASSESSED', 'RESOLVED_CONTRARY');

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
  status aura_signal_status default 'UNRESOLVED',
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
