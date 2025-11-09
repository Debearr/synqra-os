-- ============================================================
-- CONTENT FLYWHEEL SCHEMA
-- ============================================================
-- Tables for zero-cost content generation, scheduling, and retention tracking
-- Run this in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Content Jobs Table
-- Stores each content generation request
CREATE TABLE IF NOT EXISTS content_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Variants Table
-- Stores generated hooks, captions, CTAs for each job
CREATE TABLE IF NOT EXISTS content_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES content_jobs(id) ON DELETE CASCADE,
  hook TEXT NOT NULL,
  caption TEXT NOT NULL,
  cta TEXT NOT NULL,
  platform TEXT NOT NULL,
  variant_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retention Notes Table
-- Stores analytics and retention insights from platform exports
CREATE TABLE IF NOT EXISTS retention_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  video_id TEXT NOT NULL,
  avg_view_duration NUMERIC,
  avg_completion NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_jobs_status ON content_jobs(status);
CREATE INDEX IF NOT EXISTS idx_content_jobs_created ON content_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_variants_job ON content_variants(job_id);
CREATE INDEX IF NOT EXISTS idx_retention_platform ON retention_notes(platform, created_at DESC);

-- RLS Policies (adjust based on your auth setup)
-- For now, allowing service role access - customize as needed
ALTER TABLE content_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_notes ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all operations for authenticated users
-- Modify based on your authentication requirements
CREATE POLICY "Allow all for service role" ON content_jobs FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON content_variants FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON retention_notes FOR ALL USING (true);
