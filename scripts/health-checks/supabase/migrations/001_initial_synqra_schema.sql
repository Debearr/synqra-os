-- Synqra SaaS Database Schema Migration
-- This migration creates the complete database structure for Synqra luxury social media automation platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE platform_type AS ENUM ('instagram', 'twitter', 'linkedin', 'facebook', 'tiktok');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    tier user_tier DEFAULT 'free',
    credits INTEGER DEFAULT 0,
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand assets table
CREATE TABLE brand_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logo_url TEXT,
    logo_alt_text VARCHAR(255),
    primary_color VARCHAR(7), -- Hex color code
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    font_family VARCHAR(100),
    font_url TEXT,
    brand_voice TEXT,
    brand_guidelines TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    platform platform_type NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status post_status DEFAULT 'draft',
    media_urls TEXT[], -- Array of media URLs
    hashtags TEXT[],
    mentions TEXT[],
    engagement_score DECIMAL(5,2),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automations table
CREATE TABLE automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role team_role DEFAULT 'viewer',
    invitation_status invitation_status DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform connections table
CREATE TABLE platform_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_expires_at TIMESTAMP WITH TIME ZONE,
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_tier ON users(tier);

-- Brand assets indexes
CREATE INDEX idx_brand_assets_user_id ON brand_assets(user_id);

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_user_scheduled ON posts(user_id, scheduled_for);

-- Analytics indexes
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_analytics_platform ON analytics(platform);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_analytics_user_date ON analytics(user_id, date);

-- Automations indexes
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_is_active ON automations(is_active);
CREATE INDEX idx_automations_next_run_at ON automations(next_run_at);

-- Team members indexes
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_owner_id ON team_members(team_owner_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_invitation_status ON team_members(invitation_status);

-- Platform connections indexes
CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX idx_platform_connections_is_active ON platform_connections(is_active);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to reset monthly credits based on tier
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET credits = CASE 
        WHEN tier = 'free' THEN 10
        WHEN tier = 'pro' THEN 1000
        WHEN tier = 'enterprise' THEN 10000
        ELSE 0
    END,
    updated_at = NOW()
    WHERE tier IN ('free', 'pro', 'enterprise');
END;
$$ language 'plpgsql';

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ language 'plpgsql';

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'));
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS
-- =============================================

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_assets_updated_at BEFORE UPDATE ON brand_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Brand assets policies
CREATE POLICY "Users can view own brand assets" ON brand_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand assets" ON brand_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand assets" ON brand_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand assets" ON brand_assets FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analytics" ON analytics FOR DELETE USING (auth.uid() = user_id);

-- Automations policies
CREATE POLICY "Users can view own automations" ON automations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own automations" ON automations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own automations" ON automations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own automations" ON automations FOR DELETE USING (auth.uid() = user_id);

-- Team members policies
CREATE POLICY "Users can view team members for their teams" ON team_members FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = team_owner_id
);
CREATE POLICY "Team owners can manage team members" ON team_members FOR ALL USING (auth.uid() = team_owner_id);

-- Platform connections policies
CREATE POLICY "Users can view own platform connections" ON platform_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own platform connections" ON platform_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own platform connections" ON platform_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own platform connections" ON platform_connections FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SCHEDULED JOBS
-- =============================================

-- Create a function to schedule monthly credit reset
-- Note: This would typically be handled by pg_cron extension or external scheduler
CREATE OR REPLACE FUNCTION schedule_monthly_credit_reset()
RETURNS void AS $$
BEGIN
    -- This function would be called by an external scheduler (cron job, etc.)
    -- to reset credits on the first day of each month
    PERFORM reset_monthly_credits();
END;
$$ language 'plpgsql';

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default tiers configuration (if needed)
-- This could be moved to a separate seed file

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Core user accounts with subscription tiers and credit management';
COMMENT ON TABLE brand_assets IS 'Brand identity assets including logos, colors, and fonts';
COMMENT ON TABLE posts IS 'Social media posts with scheduling and status tracking';
COMMENT ON TABLE analytics IS 'Engagement metrics and performance data for posts';
COMMENT ON TABLE automations IS 'Automated workflow configurations and execution tracking';
COMMENT ON TABLE team_members IS 'Team collaboration and role-based access control';
COMMENT ON TABLE platform_connections IS 'Encrypted OAuth tokens for social media platforms';

COMMENT ON COLUMN users.tier IS 'Subscription tier determining credit limits and features';
COMMENT ON COLUMN users.credits IS 'Available credits for API usage and automation';
COMMENT ON COLUMN posts.scheduled_for IS 'When the post should be published (NULL for immediate)';
COMMENT ON COLUMN posts.engagement_score IS 'Calculated engagement score based on analytics';
COMMENT ON COLUMN platform_connections.access_token IS 'Encrypted OAuth access token for platform API';
