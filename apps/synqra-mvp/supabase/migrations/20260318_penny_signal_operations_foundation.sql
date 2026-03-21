create extension if not exists pgcrypto;

create table if not exists public.aura_candles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pair text not null,
  timeframe text not null,
  candle_time timestamptz not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, pair, timeframe, candle_time)
);

alter table public.aura_signals
  add column if not exists timeframe text,
  add column if not exists confidence numeric(4, 3),
  add column if not exists source_idempotency_key text,
  add column if not exists signal_payload jsonb not null default '{}'::jsonb;

create table if not exists public.penny_signal_deliveries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid not null references public.aura_signals(id) on delete cascade,
  access_id uuid references public.penny_access(id) on delete set null,
  telegram_chat_id text not null,
  delivery_channel text not null default 'telegram',
  status text not null default 'pending',
  attempt_count integer not null default 1,
  idempotency_key text not null unique,
  external_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint penny_signal_deliveries_status_chk
    check (status in ('pending', 'sent', 'skipped', 'failed'))
);

create index if not exists idx_aura_candles_owner_pair_timeframe_time
  on public.aura_candles(owner_id, pair, timeframe, candle_time desc);

create index if not exists idx_aura_signals_owner_pair_timeframe_created
  on public.aura_signals(owner_id, pair, timeframe, created_at desc);

create unique index if not exists idx_aura_signals_source_idempotency
  on public.aura_signals(source_idempotency_key)
  where source_idempotency_key is not null;

create index if not exists idx_penny_signal_deliveries_owner_signal
  on public.penny_signal_deliveries(owner_id, signal_id, created_at desc);

create index if not exists idx_penny_signal_deliveries_status
  on public.penny_signal_deliveries(owner_id, status, created_at desc);

drop trigger if exists trg_aura_candles_updated_at on public.aura_candles;
create trigger trg_aura_candles_updated_at
before update on public.aura_candles
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_penny_signal_deliveries_updated_at on public.penny_signal_deliveries;
create trigger trg_penny_signal_deliveries_updated_at
before update on public.penny_signal_deliveries
for each row
execute function public.set_updated_at_column();

alter table public.aura_candles enable row level security;
alter table public.penny_signal_deliveries enable row level security;

drop policy if exists aura_candles_owner_access on public.aura_candles;
create policy aura_candles_owner_access on public.aura_candles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists aura_candles_service_access on public.aura_candles;
create policy aura_candles_service_access on public.aura_candles
  for all to service_role using (true) with check (true);

drop policy if exists penny_signal_deliveries_owner_access on public.penny_signal_deliveries;
create policy penny_signal_deliveries_owner_access on public.penny_signal_deliveries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists penny_signal_deliveries_service_access on public.penny_signal_deliveries;
create policy penny_signal_deliveries_service_access on public.penny_signal_deliveries
  for all to service_role using (true) with check (true);

comment on table public.aura_candles is 'Founder-owned AuraFX candle store for Penny internal ingestion.';
comment on table public.penny_signal_deliveries is 'Founder-owned Penny delivery ledger with idempotency protection.';
