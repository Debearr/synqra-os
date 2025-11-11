-- =====================================================
-- Enterprise Health Cell Schema Migration
-- =====================================================
-- This migration creates the complete Enterprise Health Cell
-- database system with all 11 tables, indexes, constraints,
-- triggers, and utility functions.
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate service uptime percentage
CREATE OR REPLACE FUNCTION calculate_uptime_percentage(
    service_uuid UUID,
    start_date TIMESTAMP,
    end_date TIMESTAMP
)
RETURNS NUMERIC AS $$
DECLARE
    total_seconds NUMERIC;
    downtime_seconds NUMERIC;
    uptime_percentage NUMERIC;
BEGIN
    -- Calculate total seconds in the period
    total_seconds := EXTRACT(EPOCH FROM (end_date - start_date));

    -- Calculate total downtime in seconds
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (resolved_at - detected_at))), 0)
    INTO downtime_seconds
    FROM incidents
    WHERE service_id = service_uuid
    AND detected_at >= start_date
    AND detected_at <= end_date
    AND resolved_at IS NOT NULL;

    -- Calculate uptime percentage
    IF total_seconds > 0 THEN
        uptime_percentage := ((total_seconds - downtime_seconds) / total_seconds) * 100;
    ELSE
        uptime_percentage := 100;
    END IF;

    RETURN ROUND(uptime_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    incident_number TEXT;
BEGIN
    -- Get the next incident number
    SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM incidents
    WHERE incident_number LIKE 'INC-%';

    -- Format as INC-XXXXX
    incident_number := 'INC-' || LPAD(next_number::TEXT, 5, '0');

    RETURN incident_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLE 1: SERVICES
-- =====================================================
-- Core services being monitored in the health system

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(50), -- e.g., 'api', 'database', 'frontend', 'third-party'
    status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance'
    url TEXT, -- Service endpoint or URL
    metadata JSONB DEFAULT '{}', -- Flexible metadata storage
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT services_name_unique UNIQUE(name),
    CONSTRAINT services_status_check CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance'))
);

CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_metadata ON services USING gin(metadata);

-- =====================================================
-- TABLE 2: HEALTH_CHECKS
-- =====================================================
-- Individual health check configurations for services

CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    check_name VARCHAR(255) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'http', 'tcp', 'ping', 'script', 'database'
    endpoint TEXT,
    interval_seconds INTEGER DEFAULT 60, -- How often to run the check
    timeout_seconds INTEGER DEFAULT 30,
    expected_status_code INTEGER DEFAULT 200,
    retry_count INTEGER DEFAULT 3,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}', -- Additional check-specific configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT health_checks_interval_positive CHECK (interval_seconds > 0),
    CONSTRAINT health_checks_timeout_positive CHECK (timeout_seconds > 0)
);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_enabled ON health_checks(enabled);
CREATE INDEX IF NOT EXISTS idx_health_checks_type ON health_checks(check_type);

-- =====================================================
-- TABLE 3: METRICS
-- =====================================================
-- Time-series metrics data for services

CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50), -- 'ms', 'percent', 'requests', 'errors', etc.
    metric_type VARCHAR(50), -- 'response_time', 'uptime', 'error_rate', 'throughput', 'cpu', 'memory'
    tags JSONB DEFAULT '{}', -- Flexible tagging system
    recorded_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT metrics_value_not_null CHECK (metric_value IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_metrics_service ON metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_metrics_service_recorded ON metrics(service_id, recorded_at DESC);

-- =====================================================
-- TABLE 4: INCIDENTS
-- =====================================================
-- Incident tracking and management

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_incident_number(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    status VARCHAR(50) DEFAULT 'investigating', -- 'investigating', 'identified', 'monitoring', 'resolved'
    impact VARCHAR(50), -- 'major', 'minor', 'none'
    detected_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    root_cause TEXT,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT incidents_severity_check CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT incidents_status_check CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    CONSTRAINT incidents_impact_check CHECK (impact IN ('major', 'minor', 'none'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_service ON incidents(service_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_number ON incidents(incident_number);

-- =====================================================
-- TABLE 5: INCIDENT_UPDATES
-- =====================================================
-- Timeline of updates for incidents

CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    posted_by VARCHAR(255), -- User or system identifier
    posted_at TIMESTAMP DEFAULT NOW(),
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',

    CONSTRAINT incident_updates_status_check CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_incident_updates_incident ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_posted_at ON incident_updates(posted_at DESC);

-- =====================================================
-- TABLE 6: MAINTENANCE_WINDOWS
-- =====================================================
-- Scheduled maintenance tracking

CREATE TABLE IF NOT EXISTS maintenance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    impact VARCHAR(50), -- 'full_outage', 'partial_outage', 'minimal'
    notification_sent BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT maintenance_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT maintenance_impact_check CHECK (impact IN ('full_outage', 'partial_outage', 'minimal')),
    CONSTRAINT maintenance_dates_check CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_service ON maintenance_windows(service_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_windows(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_start ON maintenance_windows(scheduled_start);

-- =====================================================
-- TABLE 7: ALERT_RULES
-- =====================================================
-- Alerting rule definitions

CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(255),
    condition_type VARCHAR(50) NOT NULL, -- 'threshold', 'anomaly', 'pattern'
    operator VARCHAR(20), -- '>', '<', '>=', '<=', '==', '!='
    threshold_value NUMERIC,
    evaluation_window_seconds INTEGER DEFAULT 300,
    severity VARCHAR(50) DEFAULT 'medium',
    enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB DEFAULT '[]', -- Array of notification channel configs
    cooldown_seconds INTEGER DEFAULT 300, -- Prevent alert spam
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT alert_rules_severity_check CHECK (severity IN ('critical', 'high', 'medium', 'low'))
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_service ON alert_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric_name);

-- =====================================================
-- TABLE 8: ALERT_HISTORY
-- =====================================================
-- Historical record of triggered alerts

CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    triggered_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    alert_state VARCHAR(50) DEFAULT 'firing', -- 'firing', 'resolved', 'acknowledged'
    metric_value NUMERIC,
    threshold_value NUMERIC,
    message TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_attempts INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',

    CONSTRAINT alert_history_state_check CHECK (alert_state IN ('firing', 'resolved', 'acknowledged'))
);

CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_service ON alert_history(service_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_state ON alert_history(alert_state);

-- =====================================================
-- TABLE 9: SLA_TARGETS
-- =====================================================
-- Service Level Agreement targets

CREATE TABLE IF NOT EXISTS sla_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    target_name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'uptime', 'response_time', 'error_rate'
    target_value NUMERIC NOT NULL,
    target_unit VARCHAR(50), -- 'percent', 'ms', 'requests_per_second'
    measurement_period VARCHAR(50) DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    current_value NUMERIC,
    last_calculated_at TIMESTAMP,
    is_met BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT sla_targets_value_positive CHECK (target_value >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sla_targets_service ON sla_targets(service_id);
CREATE INDEX IF NOT EXISTS idx_sla_targets_type ON sla_targets(target_type);
CREATE INDEX IF NOT EXISTS idx_sla_targets_is_met ON sla_targets(is_met);

-- =====================================================
-- TABLE 10: STATUS_PAGE_SUBSCRIPTIONS
-- =====================================================
-- User subscriptions to status page notifications

CREATE TABLE IF NOT EXISTS status_page_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    service_ids JSONB DEFAULT '[]', -- Array of service UUIDs to subscribe to
    notification_types JSONB DEFAULT '["incident", "maintenance"]', -- Types of notifications
    is_active BOOLEAN DEFAULT TRUE,
    verification_token VARCHAR(255),
    verified_at TIMESTAMP,
    unsubscribe_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT status_page_subscriptions_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON status_page_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON status_page_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_unsubscribe_token ON status_page_subscriptions(unsubscribe_token);

-- =====================================================
-- TABLE 11: AUDIT_LOGS
-- =====================================================
-- Comprehensive audit trail for all system changes

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    changed_by VARCHAR(255), -- User or system identifier
    changed_at TIMESTAMP DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',

    CONSTRAINT audit_logs_action_check CHECK (action IN ('create', 'update', 'delete'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_checks_updated_at
    BEFORE UPDATE ON health_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_windows_updated_at
    BEFORE UPDATE ON maintenance_windows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_targets_updated_at
    BEFORE UPDATE ON sla_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_page_subscriptions_updated_at
    BEFORE UPDATE ON status_page_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Active Incidents
CREATE OR REPLACE VIEW active_incidents AS
SELECT
    i.id,
    i.incident_number,
    s.name AS service_name,
    i.title,
    i.severity,
    i.status,
    i.impact,
    i.detected_at,
    EXTRACT(EPOCH FROM (NOW() - i.detected_at))/3600 AS hours_open
FROM incidents i
JOIN services s ON i.service_id = s.id
WHERE i.status IN ('investigating', 'identified', 'monitoring')
ORDER BY i.severity DESC, i.detected_at DESC;

-- View: Service Health Summary
CREATE OR REPLACE VIEW service_health_summary AS
SELECT
    s.id,
    s.name,
    s.service_type,
    s.status,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status != 'resolved') AS active_incidents,
    COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'in_progress') AS active_maintenance,
    MAX(i.detected_at) AS last_incident_at
FROM services s
LEFT JOIN incidents i ON s.id = i.service_id
LEFT JOIN maintenance_windows m ON s.id = m.service_id
GROUP BY s.id, s.name, s.service_type, s.status;

-- View: Recent Metrics Summary
CREATE OR REPLACE VIEW recent_metrics_summary AS
SELECT
    s.name AS service_name,
    m.metric_name,
    m.metric_type,
    AVG(m.metric_value) AS avg_value,
    MIN(m.metric_value) AS min_value,
    MAX(m.metric_value) AS max_value,
    m.metric_unit,
    COUNT(*) AS sample_count
FROM metrics m
JOIN services s ON m.service_id = s.id
WHERE m.recorded_at >= NOW() - INTERVAL '1 hour'
GROUP BY s.name, m.metric_name, m.metric_type, m.metric_unit;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - OPTIONAL
-- =====================================================
-- Uncomment the following to enable RLS:

-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sla_targets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE status_page_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy (public read access):
-- CREATE POLICY "Public read access for services" ON services
--     FOR SELECT USING (true);

-- Example RLS Policy (authenticated users can insert):
-- CREATE POLICY "Authenticated users can insert metrics" ON metrics
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA (OPTIONAL)
-- =====================================================
-- Uncomment to add sample services:

-- INSERT INTO services (name, description, service_type, status) VALUES
-- ('API Gateway', 'Main API gateway handling all requests', 'api', 'operational'),
-- ('Database', 'Primary PostgreSQL database', 'database', 'operational'),
-- ('Frontend', 'React frontend application', 'frontend', 'operational'),
-- ('Authentication Service', 'OAuth2 authentication service', 'api', 'operational')
-- ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All 11 Enterprise Health Cell tables created successfully
-- with indexes, constraints, triggers, and utility functions.
-- =====================================================
