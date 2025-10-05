-- Enable required extension for UUID generation
create extension if not exists "pgcrypto";

-- USERS: Who is using Synqra
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  tier text default 'Free',
  created_at timestamp default now()
);

-- USER_TIER_POLICY: defines limits for each subscription plan
create table if not exists user_tier_policy (
  id serial primary key,
  tier text unique,
  max_jobs_per_day int,
  max_images_per_day int,
  monthly_cap numeric
);

-- POSTING_QUEUE: every generated post waiting for approval or publish
create table if not exists posting_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  platform text,
  caption text,
  image_url text,
  bvas_score numeric,
  status text default 'pending',
  created_at timestamp default now()
);

-- BVAS_LOGS: safety / compliance scoring records
create table if not exists bvas_logs (
  id serial primary key,
  posting_id uuid references posting_queue(id),
  bvas_score numeric,
  flag_reason text,
  created_at timestamp default now()
);

-- POLICY_VIOLATIONS: track abuse & soft-locks
create table if not exists policy_violations (
  id serial primary key,
  user_id uuid references users(id),
  violation_reason text,
  created_at timestamp default now()
);
