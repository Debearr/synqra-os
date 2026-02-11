-- AI Call Logs (AuraFX Router)
create table if not exists public.ai_call_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  task text not null,
  user_id text,
  prompt_hash text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_usd double precision not null default 0,
  latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_call_logs_created_at_idx
  on public.ai_call_logs(created_at desc);
create index if not exists ai_call_logs_provider_idx
  on public.ai_call_logs(provider);
create index if not exists ai_call_logs_task_idx
  on public.ai_call_logs(task);
