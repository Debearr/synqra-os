-- Synqra SaaS Complete Database Schema
-- Created for luxury social media automation platform
-- Includes all tables, RLS policies, functions, and indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('atelier', 'maison', 'couture');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE platform_type AS ENUM ('linkedin', 'instagram', 'twitter', 'tiktok', 'youtube');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier user_tier DEFAULT 'atelier' NOT NULL,
    credits INTEGER DEFAULT 0 NOT NULL,
    credits_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    brand_name TEXT,
    industry TEXT,
    company_size TEXT
);

-- Brand assets table
CREATE TABLE public.brand_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'color', 'font', 'image', 'video')),
    name TEXT NOT NULL,
    url TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Posts table
CREATE TABLE public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    platform platform_type NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status post_status DEFAULT 'draft' NOT NULL,
    platform_post_id TEXT,
    media_urls TEXT[],
    hashtags TEXT[],
    mentions TEXT[],
    engagement_data JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Analytics table
CREATE TABLE public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('likes', 'comments', 'shares', 'views', 'clicks', 'saves')),
    value INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Automations table
CREATE TABLE public.automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    workflow_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT FALSE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'manual')),
    trigger_config JSONB DEFAULT '{}',
    platforms platform_type[] NOT NULL,
    template_id UUID,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Team members table
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role team_role DEFAULT 'viewer' NOT NULL,
    invitation_status invitation_status DEFAULT 'pending' NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, team_owner_id),
    UNIQUE(email, team_owner_id)
);

-- Platform connections table
CREATE TABLE public.platform_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    platform platform_type NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    platform_user_id TEXT,
    platform_username TEXT,
    platform_email TEXT,
    scopes TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, platform)
);

-- Templates table
CREATE TABLE public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    content_template TEXT NOT NULL,
    platforms platform_type[] NOT NULL,
    variables JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Webhooks table for external integrations
CREATE TABLE public.webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    platform platform_type NOT NULL,
    webhook_url TEXT NOT NULL,
    secret TEXT,
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_created_at ON public.users(created_at);

CREATE INDEX idx_brand_assets_user_id ON public.brand_assets(user_id);
CREATE INDEX idx_brand_assets_type ON public.brand_assets(asset_type);
CREATE INDEX idx_brand_assets_primary ON public.brand_assets(user_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_platform ON public.posts(platform);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_scheduled_for ON public.posts(scheduled_for);
CREATE INDEX idx_posts_created_at ON public.posts(created_at);
CREATE INDEX idx_posts_user_scheduled ON public.posts(user_id, scheduled_for) WHERE status = 'scheduled';

CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_post_id ON public.analytics(post_id);
CREATE INDEX idx_analytics_platform ON public.analytics(platform);
CREATE INDEX idx_analytics_recorded_at ON public.analytics(recorded_at);
CREATE INDEX idx_analytics_user_platform_date ON public.analytics(user_id, platform, recorded_at);

CREATE INDEX idx_automations_user_id ON public.automations(user_id);
CREATE INDEX idx_automations_active ON public.automations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_automations_next_run ON public.automations(next_run) WHERE is_active = TRUE;

CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_owner_id ON public.team_members(team_owner_id);
CREATE INDEX idx_team_members_email ON public.team_members(email);
CREATE INDEX idx_team_members_status ON public.team_members(invitation_status);

CREATE INDEX idx_platform_connections_user_id ON public.platform_connections(user_id);
CREATE INDEX idx_platform_connections_platform ON public.platform_connections(platform);
CREATE INDEX idx_platform_connections_active ON public.platform_connections(user_id, platform) WHERE is_active = TRUE;

CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_public ON public.templates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_templates_usage ON public.templates(usage_count DESC);

CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhooks_platform ON public.webhooks(platform);
CREATE INDEX idx_webhooks_active ON public.webhooks(is_active) WHERE is_active = TRUE;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER brand_assets_updated_at
    BEFORE UPDATE ON public.brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER automations_updated_at
    BEFORE UPDATE ON public.automations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER platform_connections_updated_at
    BEFORE UPDATE ON public.platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER webhooks_updated_at
    BEFORE UPDATE ON public.webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to reset monthly credits based on tier
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET 
        credits = CASE 
            WHEN tier = 'atelier' THEN 50
            WHEN tier = 'maison' THEN 200
            WHEN tier = 'couture' THEN 500
            ELSE 0
        END,
        credits_reset_date = NOW() + INTERVAL '1 month'
    WHERE credits_reset_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to encrypt platform tokens
CREATE OR REPLACE FUNCTION public.encrypt_token(token TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(token, current_setting('app.settings.encryption_key')), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt platform tokens
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), current_setting('app.settings.encryption_key'));
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Brand assets policies
CREATE POLICY "Users can view own brand assets" ON public.brand_assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand assets" ON public.brand_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand assets" ON public.brand_assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand assets" ON public.brand_assets
    FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can view own posts" ON public.posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analytics" ON public.analytics
    FOR DELETE USING (auth.uid() = user_id);

-- Automations policies
CREATE POLICY "Users can view own automations" ON public.automations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automations" ON public.automations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations" ON public.automations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations" ON public.automations
    FOR DELETE USING (auth.uid() = user_id);

-- Team members policies
CREATE POLICY "Users can view team members for their teams" ON public.team_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = team_owner_id OR
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_owner_id = team_owner_id 
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners can manage team members" ON public.team_members
    FOR ALL USING (auth.uid() = team_owner_id);

CREATE POLICY "Users can accept team invitations" ON public.team_members
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        invitation_status = 'pending'
    );

-- Platform connections policies
CREATE POLICY "Users can view own platform connections" ON public.platform_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platform connections" ON public.platform_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platform connections" ON public.platform_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own platform connections" ON public.platform_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can view own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON public.templates
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- Webhooks policies
CREATE POLICY "Users can view own webhooks" ON public.webhooks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks" ON public.webhooks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks" ON public.webhooks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks" ON public.webhooks
    FOR DELETE USING (auth.uid() = user_id);

-- Create a scheduled job to reset credits monthly (requires pg_cron extension)
-- Note: This would need to be set up in Supabase dashboard or via cron job
-- SELECT cron.schedule('reset-monthly-credits', '0 0 1 * *', 'SELECT public.reset_monthly_credits();');

-- Insert default templates for new users
INSERT INTO public.templates (id, user_id, name, description, content_template, platforms, is_public) VALUES
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Luxury Brand Announcement', 'Professional announcement template for luxury brands', 'We''re excited to announce {{announcement}}. This represents our continued commitment to {{value_proposition}}. #luxury #innovation #{{brand_hashtag}}', ARRAY['linkedin', 'twitter']::platform_type[], TRUE),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Behind the Scenes', 'Authentic behind-the-scenes content', 'Behind the scenes: {{behind_scenes_content}}. This is how we maintain our commitment to {{quality_standard}}. #behindthescenes #craftsmanship #{{brand_hashtag}}', ARRAY['instagram', 'tiktok']::platform_type[], TRUE),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Product Spotlight', 'Highlight product features and benefits', 'Introducing {{product_name}}: {{key_feature}}. Designed for {{target_audience}} who demand {{quality_attribute}}. #productspotlight #{{product_category}} #{{brand_hashtag}}', ARRAY['linkedin', 'instagram', 'twitter']::platform_type[], TRUE);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users with subscription and tier information';
COMMENT ON TABLE public.brand_assets IS 'Brand assets including logos, colors, fonts, and other media files';
COMMENT ON TABLE public.posts IS 'Social media posts with scheduling and status tracking';
COMMENT ON TABLE public.analytics IS 'Engagement metrics and analytics data for posts';
COMMENT ON TABLE public.automations IS 'Automated posting workflows and templates';
COMMENT ON TABLE public.team_members IS 'Team collaboration and invitation management';
COMMENT ON TABLE public.platform_connections IS 'OAuth connections to social media platforms';
COMMENT ON TABLE public.templates IS 'Reusable post templates and content patterns';
COMMENT ON TABLE public.webhooks IS 'External webhook configurations for integrations';

COMMENT ON FUNCTION public.reset_monthly_credits() IS 'Resets monthly credits based on user tier';
COMMENT ON FUNCTION public.encrypt_token(TEXT) IS 'Encrypts platform access tokens for secure storage';
COMMENT ON FUNCTION public.decrypt_token(TEXT) IS 'Decrypts platform access tokens for API usage';