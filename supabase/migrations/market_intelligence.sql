-- ============================================================
-- MARKET INTELLIGENCE INFRASTRUCTURE
-- ============================================================
-- Database schema for market watching, lead generation, and 
-- competitive intelligence
--
-- Zero additional cost - uses existing Supabase
-- ============================================================

-- ============================================================
-- MARKET SIGNALS
-- ============================================================

CREATE TABLE IF NOT EXISTS market_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  source TEXT NOT NULL CHECK (source IN ('twitter', 'linkedin', 'reddit', 'hackernews', 'producthunt', 'github', 'google_trends', 'rss')),
  type TEXT NOT NULL CHECK (type IN ('trend', 'pain_point', 'competitor', 'lead', 'opportunity', 'threat', 'insight')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT NOT NULL,
  author TEXT,
  author_profile TEXT,
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  keywords TEXT[] DEFAULT '{}'::TEXT[],
  entities TEXT[] DEFAULT '{}'::TEXT[],
  actionable BOOLEAN DEFAULT false,
  action_items TEXT[] DEFAULT '{}'::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_signals_app ON market_signals(app);
CREATE INDEX IF NOT EXISTS idx_market_signals_source ON market_signals(source);
CREATE INDEX IF NOT EXISTS idx_market_signals_type ON market_signals(type);
CREATE INDEX IF NOT EXISTS idx_market_signals_relevance ON market_signals(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_market_signals_actionable ON market_signals(actionable) WHERE actionable = true;
CREATE INDEX IF NOT EXISTS idx_market_signals_detected ON market_signals(detected_at DESC);

-- ============================================================
-- LEADS
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  source TEXT NOT NULL CHECK (source IN ('twitter', 'linkedin', 'reddit', 'hackernews', 'producthunt', 'github', 'google_trends', 'rss')),
  quality TEXT NOT NULL CHECK (quality IN ('hot', 'warm', 'cold')),
  name TEXT,
  company TEXT,
  title TEXT,
  profile_url TEXT,
  contact_email TEXT,
  pain_points TEXT[] DEFAULT '{}'::TEXT[],
  intent_signals TEXT[] DEFAULT '{}'::TEXT[],
  fit_score INTEGER DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 100),
  urgency_score INTEGER DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  budget_indicator TEXT CHECK (budget_indicator IN ('Enterprise', 'SMB', 'Startup')),
  next_action TEXT NOT NULL,
  enriched_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'discarded')),
  assigned_to TEXT,
  contacted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_app ON leads(app);
CREATE INDEX IF NOT EXISTS idx_leads_quality ON leads(quality);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_fit_score ON leads(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- ============================================================
-- COMPETITOR ACTIVITY
-- ============================================================

CREATE TABLE IF NOT EXISTS competitor_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  competitor_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('launch', 'funding', 'hiring', 'marketing', 'feature', 'pricing')),
  description TEXT NOT NULL,
  impact_level TEXT NOT NULL CHECK (impact_level IN ('high', 'medium', 'low')),
  threat_assessment TEXT NOT NULL,
  opportunity_assessment TEXT,
  recommended_response TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_app ON competitor_activity(app);
CREATE INDEX IF NOT EXISTS idx_competitor_name ON competitor_activity(competitor_name);
CREATE INDEX IF NOT EXISTS idx_competitor_impact ON competitor_activity(impact_level);
CREATE INDEX IF NOT EXISTS idx_competitor_detected ON competitor_activity(detected_at DESC);

-- ============================================================
-- TREND INSIGHTS
-- ============================================================

CREATE TABLE IF NOT EXISTS trend_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  trend_name TEXT NOT NULL,
  category TEXT NOT NULL,
  momentum TEXT NOT NULL CHECK (momentum IN ('rising', 'stable', 'declining')),
  search_volume_change DECIMAL(5,2),
  relevant_keywords TEXT[] DEFAULT '{}'::TEXT[],
  target_audience TEXT NOT NULL,
  opportunity_description TEXT NOT NULL,
  recommended_positioning TEXT NOT NULL,
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trends_app ON trend_insights(app);
CREATE INDEX IF NOT EXISTS idx_trends_momentum ON trend_insights(momentum);
CREATE INDEX IF NOT EXISTS idx_trends_confidence ON trend_insights(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_trends_detected ON trend_insights(detected_at DESC);

-- ============================================================
-- LEAD SCORING RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_scoring_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('title', 'company_size', 'industry', 'pain_point', 'intent_signal', 'engagement')),
  condition JSONB NOT NULL,
  score_impact INTEGER NOT NULL CHECK (score_impact >= -50 AND score_impact <= 50),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app, rule_name)
);

CREATE INDEX IF NOT EXISTS idx_scoring_rules_app ON lead_scoring_rules(app);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_enabled ON lead_scoring_rules(enabled) WHERE enabled = true;

-- ============================================================
-- VIEWS
-- ============================================================

-- Hot leads dashboard
CREATE OR REPLACE VIEW hot_leads_dashboard AS
SELECT 
  l.id,
  l.app,
  l.quality,
  l.name,
  l.company,
  l.title,
  l.fit_score,
  l.urgency_score,
  ROUND((l.fit_score + l.urgency_score) / 2.0, 0) as composite_score,
  l.status,
  l.next_action,
  l.created_at
FROM leads l
WHERE l.quality IN ('hot', 'warm')
  AND l.status = 'new'
ORDER BY composite_score DESC, l.created_at DESC;

-- Market intelligence summary
CREATE OR REPLACE VIEW intelligence_summary AS
SELECT 
  app,
  source,
  type,
  COUNT(*) as signal_count,
  ROUND(AVG(relevance_score), 2) as avg_relevance,
  COUNT(*) FILTER (WHERE actionable = true) as actionable_count,
  MAX(detected_at) as latest_signal
FROM market_signals
WHERE detected_at >= now() - INTERVAL '7 days'
GROUP BY app, source, type;

-- Competitor threat assessment
CREATE OR REPLACE VIEW competitor_threats AS
SELECT 
  competitor_name,
  COUNT(*) as activity_count,
  COUNT(*) FILTER (WHERE impact_level = 'high') as high_impact_count,
  array_agg(DISTINCT activity_type) as activity_types,
  MAX(detected_at) as last_activity
FROM competitor_activity
WHERE detected_at >= now() - INTERVAL '30 days'
GROUP BY competitor_name
ORDER BY high_impact_count DESC, activity_count DESC;

-- Lead conversion funnel
CREATE OR REPLACE VIEW lead_funnel AS
SELECT 
  app,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate,
  ROUND(AVG(fit_score), 2) as avg_fit_score,
  ROUND(AVG(urgency_score), 2) as avg_urgency_score
FROM leads
GROUP BY app;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Calculate lead composite score
CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_fit_score INTEGER,
  p_urgency_score INTEGER,
  p_engagement_score INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
BEGIN
  -- Weighted scoring: fit (50%), urgency (40%), engagement (10%)
  RETURN ROUND((p_fit_score * 0.5) + (p_urgency_score * 0.4) + (p_engagement_score * 0.1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Determine lead quality based on scores
CREATE OR REPLACE FUNCTION determine_lead_quality(
  p_fit_score INTEGER,
  p_urgency_score INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_composite_score INTEGER;
BEGIN
  v_composite_score := calculate_lead_score(p_fit_score, p_urgency_score);
  
  IF v_composite_score >= 80 THEN
    RETURN 'hot';
  ELSIF v_composite_score >= 60 THEN
    RETURN 'warm';
  ELSE
    RETURN 'cold';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get actionable signals (high relevance + actionable)
CREATE OR REPLACE FUNCTION get_actionable_signals(
  p_app TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  source TEXT,
  type TEXT,
  title TEXT,
  relevance_score INTEGER,
  action_items TEXT[],
  detected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    ms.source,
    ms.type,
    ms.title,
    ms.relevance_score,
    ms.action_items,
    ms.detected_at
  FROM market_signals ms
  WHERE ms.app = p_app
    AND ms.actionable = true
    AND ms.relevance_score >= 70
    AND ms.detected_at >= now() - INTERVAL '7 days'
  ORDER BY ms.relevance_score DESC, ms.detected_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update lead status with timestamp
CREATE OR REPLACE FUNCTION update_lead_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  
  -- Set status-specific timestamps
  IF NEW.status = 'contacted' AND OLD.status != 'contacted' THEN
    NEW.contacted_at := now();
  ELSIF NEW.status = 'qualified' AND OLD.status != 'qualified' THEN
    NEW.qualified_at := now();
  ELSIF NEW.status = 'converted' AND OLD.status != 'converted' THEN
    NEW.converted_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_status
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_status();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to market_signals"
  ON market_signals FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to leads"
  ON leads FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to competitor_activity"
  ON competitor_activity FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to trend_insights"
  ON trend_insights FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to lead_scoring_rules"
  ON lead_scoring_rules FOR ALL TO service_role USING (true);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE market_signals IS 'Market intelligence signals from various sources';
COMMENT ON TABLE leads IS 'Qualified leads with scoring and tracking';
COMMENT ON TABLE competitor_activity IS 'Competitor activity monitoring';
COMMENT ON TABLE trend_insights IS 'Emerging trends and opportunities';
COMMENT ON TABLE lead_scoring_rules IS 'Dynamic lead scoring rules';

COMMENT ON VIEW hot_leads_dashboard IS 'High-priority leads requiring action';
COMMENT ON VIEW intelligence_summary IS 'Market intelligence summary by source and type';
COMMENT ON VIEW competitor_threats IS 'Competitor threat assessment';
COMMENT ON VIEW lead_funnel IS 'Lead conversion funnel metrics';

COMMENT ON FUNCTION calculate_lead_score(INTEGER, INTEGER, INTEGER) IS 'Calculate weighted composite lead score';
COMMENT ON FUNCTION determine_lead_quality(INTEGER, INTEGER) IS 'Determine lead quality tier based on scores';
COMMENT ON FUNCTION get_actionable_signals(TEXT, INTEGER) IS 'Get high-priority actionable signals';

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Default lead scoring rules for Synqra
INSERT INTO lead_scoring_rules (app, rule_name, rule_type, condition, score_impact, priority)
VALUES
  -- Title-based scoring
  ('synqra', 'Executive C-Level', 'title', '{"titles": ["CMO", "Chief Marketing Officer", "CEO", "Chief Executive Officer"]}', 25, 100),
  ('synqra', 'VP Marketing', 'title', '{"titles": ["VP Marketing", "Vice President Marketing", "VP Growth"]}', 20, 90),
  ('synqra', 'Director Level', 'title', '{"titles": ["Director Marketing", "Marketing Director", "Head of Growth"]}', 15, 80),
  ('synqra', 'Manager Level', 'title', '{"titles": ["Marketing Manager", "Social Media Manager", "Content Manager"]}', 10, 70),
  
  -- Company size scoring
  ('synqra', 'Enterprise (500+)', 'company_size', '{"employees": "500+"}', 20, 85),
  ('synqra', 'Mid-Market (50-500)', 'company_size', '{"employees": "50-500"}', 15, 75),
  ('synqra', 'SMB (10-50)', 'company_size', '{"employees": "10-50"}', 10, 65),
  
  -- Industry scoring
  ('synqra', 'SaaS/Tech', 'industry', '{"industries": ["SaaS", "Technology", "Software"]}', 15, 90),
  ('synqra', 'Media/Publishing', 'industry', '{"industries": ["Media", "Publishing", "Content"]}', 12, 80),
  ('synqra', 'E-commerce', 'industry', '{"industries": ["E-commerce", "Retail", "DTC"]}', 10, 75),
  
  -- Pain point scoring
  ('synqra', 'Content Creation Pain', 'pain_point', '{"keywords": ["content creation", "content struggle", "need content"]}', 20, 95),
  ('synqra', 'Social Media Pain', 'pain_point', '{"keywords": ["social media", "social automation", "social scheduling"]}', 18, 90),
  ('synqra', 'Brand Consistency', 'pain_point', '{"keywords": ["brand consistency", "brand management", "brand voice"]}', 15, 85),
  
  -- Intent signals
  ('synqra', 'Budget Mentioned', 'intent_signal', '{"keywords": ["budget", "pricing", "investment"]}', 15, 90),
  ('synqra', 'Timeline Mentioned', 'intent_signal', '{"keywords": ["need now", "asap", "urgently", "this month"]}', 20, 95),
  ('synqra', 'Comparing Tools', 'intent_signal', '{"keywords": ["alternative to", "better than", "vs", "comparison"]}', 12, 85)
ON CONFLICT (app, rule_name) DO NOTHING;
