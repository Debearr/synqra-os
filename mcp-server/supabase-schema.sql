-- Supabase Schema for MCP Orchestration Server
-- Run this in your Supabase SQL Editor to set up the required tables

-- Table for logging all MCP operations
CREATE TABLE IF NOT EXISTS mcp_logs (
  id BIGSERIAL PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'success')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_mcp_logs_level ON mcp_logs(level);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_timestamp ON mcp_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_created_at ON mcp_logs(created_at DESC);

-- Table for storing pipeline execution results
CREATE TABLE IF NOT EXISTS mcp_pipelines (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  results JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000
      ELSE NULL
    END
  ) STORED
);

-- Indexes for pipeline queries
CREATE INDEX IF NOT EXISTS idx_mcp_pipelines_task_id ON mcp_pipelines(task_id);
CREATE INDEX IF NOT EXISTS idx_mcp_pipelines_status ON mcp_pipelines(status);
CREATE INDEX IF NOT EXISTS idx_mcp_pipelines_created_at ON mcp_pipelines(created_at DESC);

-- Table for tracking service health over time
CREATE TABLE IF NOT EXISTS mcp_service_health (
  id BIGSERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'degraded')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for health tracking
CREATE INDEX IF NOT EXISTS idx_mcp_service_health_service ON mcp_service_health(service_name);
CREATE INDEX IF NOT EXISTS idx_mcp_service_health_checked_at ON mcp_service_health(checked_at DESC);

-- Table for LinkedIn posts tracking
CREATE TABLE IF NOT EXISTS mcp_linkedin_posts (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for LinkedIn posts
CREATE INDEX IF NOT EXISTS idx_mcp_linkedin_posts_status ON mcp_linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_mcp_linkedin_posts_created_at ON mcp_linkedin_posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE mcp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_service_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed for your security requirements)
CREATE POLICY "Service role can do everything on mcp_logs" ON mcp_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on mcp_pipelines" ON mcp_pipelines
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on mcp_service_health" ON mcp_service_health
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on mcp_linkedin_posts" ON mcp_linkedin_posts
  FOR ALL USING (auth.role() = 'service_role');

-- Create a view for recent pipeline statistics
CREATE OR REPLACE VIEW mcp_pipeline_stats AS
SELECT
  COUNT(*) as total_pipelines,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'running') as running,
  AVG(duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms,
  MAX(created_at) as last_run
FROM mcp_pipelines
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Create a view for service health summary
CREATE OR REPLACE VIEW mcp_service_health_summary AS
SELECT DISTINCT ON (service_name)
  service_name,
  status,
  response_time_ms,
  error_message,
  checked_at
FROM mcp_service_health
ORDER BY service_name, checked_at DESC;

COMMENT ON TABLE mcp_logs IS 'Stores all MCP server logs for monitoring and debugging';
COMMENT ON TABLE mcp_pipelines IS 'Tracks AI pipeline executions and their results';
COMMENT ON TABLE mcp_service_health IS 'Historical service health check data';
COMMENT ON TABLE mcp_linkedin_posts IS 'Tracks LinkedIn post attempts and results';
COMMENT ON VIEW mcp_pipeline_stats IS 'Real-time statistics for pipeline performance';
COMMENT ON VIEW mcp_service_health_summary IS 'Current health status of all services';
