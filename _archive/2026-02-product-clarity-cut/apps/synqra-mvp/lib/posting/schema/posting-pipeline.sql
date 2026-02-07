-- ============================================================
-- SYNQRA POSTING PIPELINE DATABASE SCHEMA
-- ============================================================
-- Run this in your Supabase SQL Editor to extend the database
-- for the posting pipeline functionality
-- ============================================================

-- OAuth tokens storage
CREATE TABLE IF NOT EXISTS public.social_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  account_id text,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, account_id)
);

-- Scheduled posts queue
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  variant_id uuid,
  platform text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  posted_at timestamptz,
  error_message text,
  retry_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Posting logs
CREATE TABLE IF NOT EXISTS public.posting_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  platform text NOT NULL,
  status text NOT NULL,
  response jsonb,
  external_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posting_logs ENABLE ROW LEVEL SECURITY;

-- Service role policies
DROP POLICY IF EXISTS service_role_tokens ON public.social_tokens;
DROP POLICY IF EXISTS service_role_scheduled ON public.scheduled_posts;
DROP POLICY IF EXISTS service_role_logs ON public.posting_logs;

CREATE POLICY service_role_tokens ON public.social_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_scheduled ON public.scheduled_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_logs ON public.posting_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posting_logs_job ON public.posting_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_platform ON public.social_tokens(platform);

-- Media support for content variants
ALTER TABLE public.content_variants
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS media_metadata jsonb;

-- Comments for documentation
COMMENT ON TABLE public.social_tokens IS 'OAuth tokens for social media platforms';
COMMENT ON TABLE public.scheduled_posts IS 'Queue of posts scheduled for publishing';
COMMENT ON TABLE public.posting_logs IS 'Historical log of all posting attempts';
