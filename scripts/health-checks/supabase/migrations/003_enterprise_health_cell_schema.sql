-- Enterprise Health Cell System - Complete Database Schema
-- Monitors Supabase infrastructure for Synqra OS, NØID Labs, and AuraFX
-- Created: 2025-11-06

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- ENUMS AND TYPES
-- ==============================================

CREATE TYPE health_status AS ENUM ('healthy', 'degraded', 'critical', 'unknown');
CREATE TYPE service_type AS ENUM ('supabase', 'postgres', 'rest_api', 'auth', 'storage', 'realtime', 'functions', 'n8n', 'external');
CREATE TYPE project_name AS ENUM ('synqra_os', 'noid_labs', 'aurafx', 'shared');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'suppressed');
CREATE TYPE incident_status AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');
CREATE TYPE recovery_action_type AS ENUM ('auto_restart', 'manual_intervention', 'escalate', 'notify_only');

-- ==============================================
-- CORE HEALTH MONITORING TABLES
-- ==============================================

-- Projects configuration table
CREATE TABLE public.health_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_key project_name UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    supabase_url TEXT NOT NULL,
    supabase_project_id TEXT,
    owner_email TEXT,
    notification_emails TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Services configuration table
CREATE TABLE public.health_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.health_projects(id) ON DELETE CASCADE NOT NULL,
    service_key service_type NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    endpoint_url TEXT,
    check_interval_seconds INTEGER DEFAULT 300 NOT NULL,
    timeout_ms INTEGER DEFAULT 10000 NOT NULL,
    retry_count INTEGER DEFAULT 3 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    thresholds JSONB DEFAULT '{"response_time_warning_ms": 2000, "response_time_critical_ms": 5000, "error_rate_warning": 0.05, "error_rate_critical": 0.1}'::jsonb,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, service_key)
);

-- Health check logs table
CREATE TABLE public.health_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    check_id TEXT NOT NULL,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    status health_status NOT NULL,
    response_time_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    message TEXT,
    error_stack TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Service status rollup (current state)
CREATE TABLE public.health_service_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_status health_status NOT NULL DEFAULT 'unknown',
    last_check_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    consecutive_failures INTEGER DEFAULT 0,
    consecutive_successes INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    uptime_percentage DECIMAL(5,2),
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    last_error_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- ALERTING AND NOTIFICATIONS
-- ==============================================

-- Alert rules configuration
CREATE TABLE public.health_alert_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    rule_name TEXT NOT NULL,
    description TEXT,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('consecutive_failures', 'response_time', 'error_rate', 'uptime', 'custom')),
    condition_config JSONB NOT NULL DEFAULT '{}',
    severity alert_severity NOT NULL DEFAULT 'warning',
    notification_channels TEXT[] DEFAULT ARRAY['n8n', 'email'],
    cooldown_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Active alerts table
CREATE TABLE public.health_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_rule_id UUID REFERENCES public.health_alert_rules(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'active',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Alert notification log
CREATE TABLE public.health_alert_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_id UUID REFERENCES public.health_alerts(id) ON DELETE CASCADE NOT NULL,
    channel TEXT NOT NULL,
    recipient TEXT,
    payload JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- INCIDENT MANAGEMENT
-- ==============================================

-- Incidents table
CREATE TABLE public.health_incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    incident_number SERIAL UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity alert_severity NOT NULL,
    status incident_status NOT NULL DEFAULT 'investigating',
    service_id UUID REFERENCES public.health_services(id) ON DELETE SET NULL,
    affected_services UUID[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    impact_description TEXT,
    root_cause TEXT,
    resolution_summary TEXT,
    assigned_to TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Incident timeline/updates
CREATE TABLE public.health_incident_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    incident_id UUID REFERENCES public.health_incidents(id) ON DELETE CASCADE NOT NULL,
    update_type TEXT NOT NULL CHECK (update_type IN ('investigating', 'identified', 'update', 'monitoring', 'resolved')),
    message TEXT NOT NULL,
    created_by TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- RECOVERY AUTOMATION
-- ==============================================

-- Recovery actions configuration
CREATE TABLE public.health_recovery_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    action_name TEXT NOT NULL,
    action_type recovery_action_type NOT NULL,
    trigger_condition TEXT NOT NULL,
    action_config JSONB NOT NULL DEFAULT '{}',
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    is_enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Recovery execution log
CREATE TABLE public.health_recovery_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recovery_action_id UUID REFERENCES public.health_recovery_actions(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    incident_id UUID REFERENCES public.health_incidents(id) ON DELETE SET NULL,
    action_type recovery_action_type NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    result_message TEXT,
    error_details TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- METRICS AND ANALYTICS
-- ==============================================

-- Service metrics rollup (hourly)
CREATE TABLE public.health_metrics_hourly (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    p50_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2),
    downtime_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(service_id, hour_start)
);

-- Service metrics rollup (daily)
CREATE TABLE public.health_metrics_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.health_services(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2),
    downtime_minutes INTEGER DEFAULT 0,
    incidents_count INTEGER DEFAULT 0,
    alerts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(service_id, date)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Health projects
CREATE INDEX idx_health_projects_active ON public.health_projects(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_health_projects_key ON public.health_projects(project_key);

-- Health services
CREATE INDEX idx_health_services_project ON public.health_services(project_id);
CREATE INDEX idx_health_services_active ON public.health_services(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_health_services_type ON public.health_services(service_key);

-- Health logs
CREATE INDEX idx_health_logs_service ON public.health_logs(service_id);
CREATE INDEX idx_health_logs_timestamp ON public.health_logs(timestamp DESC);
CREATE INDEX idx_health_logs_status ON public.health_logs(status);
CREATE INDEX idx_health_logs_check_id ON public.health_logs(check_id);
CREATE INDEX idx_health_logs_service_timestamp ON public.health_logs(service_id, timestamp DESC);

-- Service status
CREATE INDEX idx_health_service_status_service ON public.health_service_status(service_id);
CREATE INDEX idx_health_service_status_current ON public.health_service_status(current_status);

-- Alert rules
CREATE INDEX idx_health_alert_rules_service ON public.health_alert_rules(service_id);
CREATE INDEX idx_health_alert_rules_active ON public.health_alert_rules(is_active) WHERE is_active = TRUE;

-- Alerts
CREATE INDEX idx_health_alerts_service ON public.health_alerts(service_id);
CREATE INDEX idx_health_alerts_status ON public.health_alerts(status);
CREATE INDEX idx_health_alerts_severity ON public.health_alerts(severity);
CREATE INDEX idx_health_alerts_triggered ON public.health_alerts(triggered_at DESC);
CREATE INDEX idx_health_alerts_active ON public.health_alerts(status) WHERE status IN ('active', 'acknowledged');

-- Alert notifications
CREATE INDEX idx_health_alert_notifications_alert ON public.health_alert_notifications(alert_id);
CREATE INDEX idx_health_alert_notifications_status ON public.health_alert_notifications(status);

-- Incidents
CREATE INDEX idx_health_incidents_status ON public.health_incidents(status);
CREATE INDEX idx_health_incidents_severity ON public.health_incidents(severity);
CREATE INDEX idx_health_incidents_started ON public.health_incidents(started_at DESC);
CREATE INDEX idx_health_incidents_service ON public.health_incidents(service_id);

-- Incident updates
CREATE INDEX idx_health_incident_updates_incident ON public.health_incident_updates(incident_id);
CREATE INDEX idx_health_incident_updates_created ON public.health_incident_updates(created_at DESC);

-- Recovery actions
CREATE INDEX idx_health_recovery_actions_service ON public.health_recovery_actions(service_id);
CREATE INDEX idx_health_recovery_actions_enabled ON public.health_recovery_actions(is_enabled) WHERE is_enabled = TRUE;

-- Recovery log
CREATE INDEX idx_health_recovery_log_action ON public.health_recovery_log(recovery_action_id);
CREATE INDEX idx_health_recovery_log_service ON public.health_recovery_log(service_id);
CREATE INDEX idx_health_recovery_log_incident ON public.health_recovery_log(incident_id);
CREATE INDEX idx_health_recovery_log_started ON public.health_recovery_log(started_at DESC);

-- Metrics hourly
CREATE INDEX idx_health_metrics_hourly_service ON public.health_metrics_hourly(service_id);
CREATE INDEX idx_health_metrics_hourly_time ON public.health_metrics_hourly(hour_start DESC);
CREATE INDEX idx_health_metrics_hourly_service_time ON public.health_metrics_hourly(service_id, hour_start DESC);

-- Metrics daily
CREATE INDEX idx_health_metrics_daily_service ON public.health_metrics_daily(service_id);
CREATE INDEX idx_health_metrics_daily_date ON public.health_metrics_daily(date DESC);
CREATE INDEX idx_health_metrics_daily_service_date ON public.health_metrics_daily(service_id, date DESC);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to update service status
CREATE OR REPLACE FUNCTION public.update_health_service_status()
RETURNS TRIGGER AS $$
DECLARE
    v_status health_status;
    v_consecutive_failures INTEGER;
    v_consecutive_successes INTEGER;
BEGIN
    -- Get current consecutive failures/successes
    SELECT consecutive_failures, consecutive_successes
    INTO v_consecutive_failures, v_consecutive_successes
    FROM public.health_service_status
    WHERE service_id = NEW.service_id;

    -- Update consecutive counts
    IF NEW.status IN ('healthy') THEN
        v_consecutive_successes := COALESCE(v_consecutive_successes, 0) + 1;
        v_consecutive_failures := 0;
    ELSE
        v_consecutive_failures := COALESCE(v_consecutive_failures, 0) + 1;
        v_consecutive_successes := 0;
    END IF;

    -- Insert or update service status
    INSERT INTO public.health_service_status (
        service_id,
        current_status,
        last_check_at,
        last_success_at,
        last_failure_at,
        consecutive_failures,
        consecutive_successes,
        total_checks,
        successful_checks,
        failed_checks,
        last_error_message
    ) VALUES (
        NEW.service_id,
        NEW.status,
        NEW.timestamp,
        CASE WHEN NEW.status = 'healthy' THEN NEW.timestamp ELSE NULL END,
        CASE WHEN NEW.status IN ('degraded', 'critical') THEN NEW.timestamp ELSE NULL END,
        v_consecutive_failures,
        v_consecutive_successes,
        1,
        CASE WHEN NEW.status = 'healthy' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status IN ('degraded', 'critical') THEN 1 ELSE 0 END,
        NEW.message
    )
    ON CONFLICT (service_id) DO UPDATE SET
        current_status = NEW.status,
        last_check_at = NEW.timestamp,
        last_success_at = CASE
            WHEN NEW.status = 'healthy' THEN NEW.timestamp
            ELSE health_service_status.last_success_at
        END,
        last_failure_at = CASE
            WHEN NEW.status IN ('degraded', 'critical') THEN NEW.timestamp
            ELSE health_service_status.last_failure_at
        END,
        consecutive_failures = v_consecutive_failures,
        consecutive_successes = v_consecutive_successes,
        total_checks = health_service_status.total_checks + 1,
        successful_checks = health_service_status.successful_checks +
            CASE WHEN NEW.status = 'healthy' THEN 1 ELSE 0 END,
        failed_checks = health_service_status.failed_checks +
            CASE WHEN NEW.status IN ('degraded', 'critical') THEN 1 ELSE 0 END,
        last_error_message = CASE
            WHEN NEW.status IN ('degraded', 'critical') THEN NEW.message
            ELSE health_service_status.last_error_message
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate service uptime
CREATE OR REPLACE FUNCTION public.calculate_service_uptime(
    p_service_id UUID,
    p_hours_back INTEGER DEFAULT 24
)
RETURNS DECIMAL AS $$
DECLARE
    v_total_checks INTEGER;
    v_successful_checks INTEGER;
    v_uptime DECIMAL;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'healthy')
    INTO v_total_checks, v_successful_checks
    FROM public.health_logs
    WHERE service_id = p_service_id
    AND timestamp >= NOW() - (p_hours_back || ' hours')::INTERVAL;

    IF v_total_checks = 0 THEN
        RETURN 0;
    END IF;

    v_uptime := (v_successful_checks::DECIMAL / v_total_checks::DECIMAL) * 100;
    RETURN ROUND(v_uptime, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate hourly metrics
CREATE OR REPLACE FUNCTION public.aggregate_health_metrics_hourly()
RETURNS void AS $$
BEGIN
    INSERT INTO public.health_metrics_hourly (
        service_id,
        hour_start,
        total_checks,
        successful_checks,
        failed_checks,
        avg_response_time_ms,
        min_response_time_ms,
        max_response_time_ms,
        uptime_percentage
    )
    SELECT
        service_id,
        date_trunc('hour', timestamp) AS hour_start,
        COUNT(*) AS total_checks,
        COUNT(*) FILTER (WHERE status = 'healthy') AS successful_checks,
        COUNT(*) FILTER (WHERE status IN ('degraded', 'critical')) AS failed_checks,
        ROUND(AVG(response_time_ms)::NUMERIC, 2) AS avg_response_time_ms,
        MIN(response_time_ms) AS min_response_time_ms,
        MAX(response_time_ms) AS max_response_time_ms,
        ROUND((COUNT(*) FILTER (WHERE status = 'healthy')::DECIMAL / COUNT(*)::DECIMAL * 100)::NUMERIC, 2) AS uptime_percentage
    FROM public.health_logs
    WHERE timestamp >= NOW() - INTERVAL '2 hours'
    AND timestamp < date_trunc('hour', NOW())
    GROUP BY service_id, date_trunc('hour', timestamp)
    ON CONFLICT (service_id, hour_start) DO UPDATE SET
        total_checks = EXCLUDED.total_checks,
        successful_checks = EXCLUDED.successful_checks,
        failed_checks = EXCLUDED.failed_checks,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        min_response_time_ms = EXCLUDED.min_response_time_ms,
        max_response_time_ms = EXCLUDED.max_response_time_ms,
        uptime_percentage = EXCLUDED.uptime_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_health_metrics_daily()
RETURNS void AS $$
BEGIN
    INSERT INTO public.health_metrics_daily (
        service_id,
        date,
        total_checks,
        successful_checks,
        failed_checks,
        avg_response_time_ms,
        min_response_time_ms,
        max_response_time_ms,
        uptime_percentage,
        incidents_count,
        alerts_count
    )
    SELECT
        hm.service_id,
        DATE(hm.hour_start) AS date,
        SUM(hm.total_checks) AS total_checks,
        SUM(hm.successful_checks) AS successful_checks,
        SUM(hm.failed_checks) AS failed_checks,
        ROUND(AVG(hm.avg_response_time_ms)::NUMERIC, 2) AS avg_response_time_ms,
        MIN(hm.min_response_time_ms) AS min_response_time_ms,
        MAX(hm.max_response_time_ms) AS max_response_time_ms,
        ROUND(AVG(hm.uptime_percentage)::NUMERIC, 2) AS uptime_percentage,
        COUNT(DISTINCT i.id) FILTER (WHERE DATE(i.started_at) = DATE(hm.hour_start)) AS incidents_count,
        COUNT(DISTINCT a.id) FILTER (WHERE DATE(a.triggered_at) = DATE(hm.hour_start)) AS alerts_count
    FROM public.health_metrics_hourly hm
    LEFT JOIN public.health_incidents i ON i.service_id = hm.service_id
    LEFT JOIN public.health_alerts a ON a.service_id = hm.service_id
    WHERE DATE(hm.hour_start) >= CURRENT_DATE - INTERVAL '7 days'
    AND DATE(hm.hour_start) < CURRENT_DATE
    GROUP BY hm.service_id, DATE(hm.hour_start)
    ON CONFLICT (service_id, date) DO UPDATE SET
        total_checks = EXCLUDED.total_checks,
        successful_checks = EXCLUDED.successful_checks,
        failed_checks = EXCLUDED.failed_checks,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        min_response_time_ms = EXCLUDED.min_response_time_ms,
        max_response_time_ms = EXCLUDED.max_response_time_ms,
        uptime_percentage = EXCLUDED.uptime_percentage,
        incidents_count = EXCLUDED.incidents_count,
        alerts_count = EXCLUDED.alerts_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_health_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.health_logs
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger to update service status on new health log
CREATE TRIGGER trigger_update_health_service_status
    AFTER INSERT ON public.health_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_health_service_status();

-- Trigger to update timestamps
CREATE TRIGGER trigger_health_projects_updated_at
    BEFORE UPDATE ON public.health_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_health_services_updated_at
    BEFORE UPDATE ON public.health_services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_health_alert_rules_updated_at
    BEFORE UPDATE ON public.health_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_health_alerts_updated_at
    BEFORE UPDATE ON public.health_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_health_incidents_updated_at
    BEFORE UPDATE ON public.health_incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_health_recovery_actions_updated_at
    BEFORE UPDATE ON public.health_recovery_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Insert default projects
INSERT INTO public.health_projects (project_key, display_name, description, supabase_url, owner_email, notification_emails) VALUES
('synqra_os', 'Synqra OS', 'Luxury social media automation platform', 'https://tjfeindwmpuyayjvftke.supabase.co', 'debear@noidlux.com', ARRAY['debear@noidlux.com']),
('noid_labs', 'NØID Labs', 'Innovation and research division', 'https://tjfeindwmpuyayjvftke.supabase.co', 'debear@noidlux.com', ARRAY['debear@noidlux.com']),
('aurafx', 'AuraFX', 'Creative effects platform', 'https://tjfeindwmpuyayjvftke.supabase.co', 'debear@noidlux.com', ARRAY['debear@noidlux.com']),
('shared', 'Shared Infrastructure', 'Shared services across all projects', 'https://tjfeindwmpuyayjvftke.supabase.co', 'debear@noidlux.com', ARRAY['debear@noidlux.com'])
ON CONFLICT (project_key) DO NOTHING;

-- Insert default services for each project
DO $$
DECLARE
    synqra_project_id UUID;
    noid_project_id UUID;
    aurafx_project_id UUID;
    shared_project_id UUID;
BEGIN
    SELECT id INTO synqra_project_id FROM public.health_projects WHERE project_key = 'synqra_os';
    SELECT id INTO noid_project_id FROM public.health_projects WHERE project_key = 'noid_labs';
    SELECT id INTO aurafx_project_id FROM public.health_projects WHERE project_key = 'aurafx';
    SELECT id INTO shared_project_id FROM public.health_projects WHERE project_key = 'shared';

    -- Synqra OS services
    INSERT INTO public.health_services (project_id, service_key, display_name, description, endpoint_url, check_interval_seconds) VALUES
    (synqra_project_id, 'postgres', 'PostgreSQL Database', 'Main database for Synqra OS', NULL, 300),
    (synqra_project_id, 'rest_api', 'REST API', 'Supabase REST API', 'https://tjfeindwmpuyayjvftke.supabase.co/rest/v1/', 300),
    (synqra_project_id, 'auth', 'Authentication', 'Supabase Auth service', 'https://tjfeindwmpuyayjvftke.supabase.co/auth/v1/health', 300),
    (synqra_project_id, 'storage', 'Storage', 'Supabase Storage service', 'https://tjfeindwmpuyayjvftke.supabase.co/storage/v1/bucket', 300),
    (synqra_project_id, 'realtime', 'Realtime', 'Supabase Realtime service', NULL, 300)
    ON CONFLICT (project_id, service_key) DO NOTHING;

    -- NØID Labs services
    INSERT INTO public.health_services (project_id, service_key, display_name, description, endpoint_url, check_interval_seconds) VALUES
    (noid_project_id, 'postgres', 'PostgreSQL Database', 'Main database for NØID Labs', NULL, 300),
    (noid_project_id, 'rest_api', 'REST API', 'Supabase REST API', 'https://tjfeindwmpuyayjvftke.supabase.co/rest/v1/', 300)
    ON CONFLICT (project_id, service_key) DO NOTHING;

    -- AuraFX services
    INSERT INTO public.health_services (project_id, service_key, display_name, description, endpoint_url, check_interval_seconds) VALUES
    (aurafx_project_id, 'postgres', 'PostgreSQL Database', 'Main database for AuraFX', NULL, 300),
    (aurafx_project_id, 'rest_api', 'REST API', 'Supabase REST API', 'https://tjfeindwmpuyayjvftke.supabase.co/rest/v1/', 300)
    ON CONFLICT (project_id, service_key) DO NOTHING;

    -- Shared services
    INSERT INTO public.health_services (project_id, service_key, display_name, description, endpoint_url, check_interval_seconds) VALUES
    (shared_project_id, 'n8n', 'N8N Automation', 'N8N workflow automation', NULL, 600)
    ON CONFLICT (project_id, service_key) DO NOTHING;
END $$;

-- Insert default alert rules
INSERT INTO public.health_alert_rules (service_id, rule_name, description, condition_type, condition_config, severity, notification_channels)
SELECT
    hs.id,
    'Consecutive Failures Alert',
    'Trigger alert after 3 consecutive failures',
    'consecutive_failures',
    '{"threshold": 3}'::jsonb,
    'critical',
    ARRAY['n8n', 'email']
FROM public.health_services hs
WHERE NOT EXISTS (
    SELECT 1 FROM public.health_alert_rules har
    WHERE har.service_id = hs.id AND har.rule_name = 'Consecutive Failures Alert'
);

-- ==============================================
-- SECURITY AND PERMISSIONS
-- ==============================================

-- Row Level Security (RLS) is disabled for health monitoring tables
-- These tables are managed by service accounts only
ALTER TABLE public.health_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_service_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alert_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alert_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_incident_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_recovery_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_recovery_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics_hourly DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics_daily DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users (dashboard access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE public.health_projects IS 'Configuration for monitored projects (Synqra OS, NØID Labs, AuraFX)';
COMMENT ON TABLE public.health_services IS 'Services to monitor within each project';
COMMENT ON TABLE public.health_logs IS 'Detailed logs of all health checks performed';
COMMENT ON TABLE public.health_service_status IS 'Current status rollup for each service';
COMMENT ON TABLE public.health_alert_rules IS 'Configurable alert rules for services';
COMMENT ON TABLE public.health_alerts IS 'Active and historical alerts';
COMMENT ON TABLE public.health_alert_notifications IS 'Log of all alert notifications sent';
COMMENT ON TABLE public.health_incidents IS 'Major incidents requiring investigation';
COMMENT ON TABLE public.health_incident_updates IS 'Timeline of incident updates';
COMMENT ON TABLE public.health_recovery_actions IS 'Automated recovery actions configuration';
COMMENT ON TABLE public.health_recovery_log IS 'Log of recovery actions executed';
COMMENT ON TABLE public.health_metrics_hourly IS 'Hourly aggregated metrics';
COMMENT ON TABLE public.health_metrics_daily IS 'Daily aggregated metrics';
