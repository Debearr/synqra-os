-- =====================================================
-- PulseEngine Module Migration
-- =====================================================
-- Adds trend-based content automation capabilities
-- Module ID: pulse
-- Brand: PulseEngine
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PULSE TRENDS TABLE
-- =====================================================
-- Caches trending topics from social platforms
CREATE TABLE IF NOT EXISTS pulse_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'x', 'linkedin', 'instagram')),
  score NUMERIC DEFAULT 0,
  rank INTEGER,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 hours'),
  metadata JSONB DEFAULT '{}',
  UNIQUE(topic, platform, cached_at)
);

CREATE INDEX idx_pulse_trends_platform ON pulse_trends(platform);
CREATE INDEX idx_pulse_trends_score ON pulse_trends(score DESC);
CREATE INDEX idx_pulse_trends_expires ON pulse_trends(expires_at);

-- =====================================================
-- PULSE CAMPAIGNS TABLE
-- =====================================================
-- Stores generated campaigns with metadata
CREATE TABLE IF NOT EXISTS pulse_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  campaign_json JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  trend_context JSONB DEFAULT '[]',
  platforms TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pulse_campaigns_user ON pulse_campaigns(user_id);
CREATE INDEX idx_pulse_campaigns_status ON pulse_campaigns(status);
CREATE INDEX idx_pulse_campaigns_scheduled ON pulse_campaigns(scheduled_for) WHERE status = 'scheduled';

-- =====================================================
-- PULSE TOKENS TABLE
-- =====================================================
-- Tracks token usage for rate limiting
CREATE TABLE IF NOT EXISTS pulse_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tokens_used INTEGER DEFAULT 0,
  tokens_limit INTEGER DEFAULT 100,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pulse_tokens_user ON pulse_tokens(user_id);

-- =====================================================
-- PULSE SHARES TABLE
-- =====================================================
-- Tracks viral share loop clicks
CREATE TABLE IF NOT EXISTS pulse_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES pulse_campaigns(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  converted BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  ip_hash TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_pulse_shares_campaign ON pulse_shares(campaign_id);
CREATE INDEX idx_pulse_shares_clicked ON pulse_shares(clicked_at DESC);

-- =====================================================
-- EXTEND EXISTING TABLES
-- =====================================================

-- Add source tracking to content_jobs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_jobs' AND column_name = 'source'
  ) THEN
    ALTER TABLE content_jobs ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_jobs' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE content_jobs ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pulse_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER pulse_campaigns_updated_at
  BEFORE UPDATE ON pulse_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_pulse_updated_at();

CREATE TRIGGER pulse_tokens_updated_at
  BEFORE UPDATE ON pulse_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_pulse_updated_at();

-- Function to clean expired trends
CREATE OR REPLACE FUNCTION cleanup_expired_trends()
RETURNS void AS $$
BEGIN
  DELETE FROM pulse_trends WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate viral coefficient for a campaign
CREATE OR REPLACE FUNCTION get_viral_coefficient(campaign_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_shares INTEGER;
  total_conversions INTEGER;
  coefficient NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_shares
  FROM pulse_shares
  WHERE campaign_id = campaign_uuid;
  
  SELECT COUNT(*) INTO total_conversions
  FROM pulse_shares
  WHERE campaign_id = campaign_uuid AND converted = TRUE;
  
  IF total_shares > 0 THEN
    coefficient := total_conversions::NUMERIC / total_shares::NUMERIC;
  ELSE
    coefficient := 0;
  END IF;
  
  RETURN coefficient;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pulse_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_shares ENABLE ROW LEVEL SECURITY;

-- Policies for pulse_trends (read-only for all authenticated users)
CREATE POLICY "Allow read for authenticated users" ON pulse_trends
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for pulse_campaigns (users can only see their own)
CREATE POLICY "Users can view own campaigns" ON pulse_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON pulse_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON pulse_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON pulse_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for pulse_tokens
CREATE POLICY "Users can view own tokens" ON pulse_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON pulse_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for pulse_shares (read-only)
CREATE POLICY "Allow read for campaign owners" ON pulse_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pulse_campaigns 
      WHERE pulse_campaigns.id = pulse_shares.campaign_id 
      AND pulse_campaigns.user_id = auth.uid()
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pulse_trends IS 'Cached trending topics from social platforms';
COMMENT ON TABLE pulse_campaigns IS 'User-generated campaigns with trend context';
COMMENT ON TABLE pulse_tokens IS 'Token usage tracking for rate limiting';
COMMENT ON TABLE pulse_shares IS 'Viral share loop click tracking';

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert some sample trends for testing (can be removed in production)
INSERT INTO pulse_trends (topic, platform, score, rank) VALUES
  ('AI automation trends', 'linkedin', 95, 1),
  ('Social media strategy 2025', 'x', 88, 2),
  ('Content creation hacks', 'tiktok', 92, 1),
  ('YouTube algorithm updates', 'youtube', 85, 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON pulse_trends TO authenticated;
GRANT ALL ON pulse_campaigns TO authenticated;
GRANT ALL ON pulse_tokens TO authenticated;
GRANT ALL ON pulse_shares TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'PulseEngine migration completed successfully';
END $$;
