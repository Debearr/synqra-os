-- ============================================================
-- COUNCIL TABLES (USER-SCOPED)
-- ============================================================
-- Additive tables for council sessions, messages, and agents
-- ============================================================

CREATE TABLE IF NOT EXISTS council_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS council_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES council_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS council_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES council_sessions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES council_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_council_sessions_user_id ON council_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_council_sessions_created_at ON council_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_council_agents_user_id ON council_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_council_agents_created_at ON council_agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_council_messages_user_id ON council_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_council_messages_created_at ON council_messages(created_at DESC);

ALTER TABLE council_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Council sessions user access"
  ON council_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Council agents user access"
  ON council_agents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Council messages user access"
  ON council_messages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE council_sessions IS 'User-scoped council sessions for queryCouncil';
COMMENT ON TABLE council_agents IS 'User-scoped council agents used in sessions';
COMMENT ON TABLE council_messages IS 'User-scoped council messages for sessions';
