-- synqra-automation/supabase/schema.sql
-- Supporting tables for the Synqra automated social pipeline.

create extension if not exists "uuid-ossp";

-- Content queue stores AI-generated copy prior to scheduling
create table if not exists content_queue (
  id uuid primary key default uuid_generate_v4(),
  platform text check (platform in ('twitter', 'tiktok')),
  theme text,
  copy text,
  hashtags text[],
  asset_url text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists content_queue_status_created_idx
  on content_queue (status, created_at);

-- Calendar posts track the time a queued item should go live
create table if not exists calendar_posts (
  id uuid primary key default uuid_generate_v4(),
  queue_id uuid references content_queue(id) on delete set null,
  platform text,
  post_date timestamptz,
  copy text,
  hashtags text[],
  asset_url text,
  status text default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists calendar_posts_status_post_date_idx
  on calendar_posts (status, post_date);

-- Post metrics capture early engagement snapshots
create table if not exists post_metrics (
  id uuid primary key default uuid_generate_v4(),
  platform text,
  external_post_id text,
  impressions integer default 0,
  engagement numeric,
  likes integer default 0,
  shares integer default 0,
  comments integer default 0,
  recorded_at timestamptz default now()
);

create index if not exists post_metrics_platform_recorded_idx
  on post_metrics (platform, recorded_at);
