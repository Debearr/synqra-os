-- Durable payload storage for posting queue recovery

alter table if exists public.scheduled_posts
  add column if not exists payload jsonb not null default '{}'::jsonb;
