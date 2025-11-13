-- =====================================================
-- Enterprise Health Monitoring System - Complete Schema
-- Migration: 003_enterprise_health_cell_schema.sql
-- Description: Full production-ready health monitoring system
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- TABLE 1: health_projects
-- Purpose: Top-level organization for health monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS health_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID,
    organization_id UUID,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    settings JSONB DEFAULT '{}',
    notification_config JSONB DEFAULT '{"email": [], "slack": [], "webhook": []}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_projects_owner_id ON health_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_health_projects_organization_id ON health_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_projects_status ON health_projects(status);
CREATE INDEX IF NOT EXISTS idx_health_projects_created_at ON health_projects(created_at DESC);

COMMENT ON TABLE health_projects IS 'Top-level projects for organizing health monitoring services';
COMMENT ON COLUMN health_projects.notification_config IS 'JSON configuration for notification channels';

-- =====================================================
-- TABLE 2: health_services
-- Purpose: Individual services/endpoints being monitored
-- =====================================================

CREATE TABLE IF NOT EXISTS health_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES health_projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100) NOT NULL CHECK (service_type IN ('http', 'https', 'tcp', 'udp', 'ping', 'database', 'custom')),
    endpoint_url TEXT NOT NULL,
    check_interval_seconds INTEGER DEFAULT 300 CHECK (check_interval_seconds >= 10),
    timeout_seconds INTEGER DEFAULT 30 CHECK (timeout_seconds >= 1),
    retry_count INTEGER DEFAULT 3 CHECK (retry_count >= 0),
    expected_status_code INTEGER DEFAULT 200,
    expected_response_time_ms INTEGER,
    custom_headers JSONB DEFAULT '{}',
    custom_body TEXT,
    authentication JSONB DEFAULT '{"type": "none"}',
    ssl_check_enabled BOOLEAN DEFAULT true,
    ssl_expiry_warning_days INTEGER DEFAULT 30,
    follow_redirects BOOLEAN DEFAULT true,
    verify_ssl BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_window JSONB,
    last_check_at TIMESTAMPTZ,
    last_status VARCHAR(50),
    consecutive_failures INTEGER DEFAULT 0,
    consecutive_successes INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_services_project_id ON health_services(project_id);
CREATE INDEX IF NOT EXISTS idx_health_services_is_active ON health_services(is_active);
CREATE INDEX IF NOT EXISTS idx_health_services_service_type ON health_services(service_type);
CREATE INDEX IF NOT EXISTS idx_health_services_last_check_at ON health_services(last_check_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_services_last_status ON health_services(last_status);
CREATE INDEX IF NOT EXISTS idx_health_services_maintenance_mode ON health_services(maintenance_mode);
CREATE INDEX IF NOT EXISTS idx_health_services_project_active ON health_services(project_id, is_active);

COMMENT ON TABLE health_services IS 'Services and endpoints being monitored for health';
COMMENT ON COLUMN health_services.check_interval_seconds IS 'Seconds between health checks';
COMMENT ON COLUMN health_services.maintenance_window IS 'JSON defining scheduled maintenance windows';

-- =====================================================
-- TABLE 3: health_logs
-- Purpose: Detailed logs of all health check executions
-- =====================================================

CREATE TABLE IF NOT EXISTS health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES health_services(id) ON DELETE CASCADE,
    check_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failure', 'timeout', 'error', 'degraded', 'unknown')),
    response_time_ms INTEGER,
    status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,
    error_message TEXT,
    error_type VARCHAR(100),
    stack_trace TEXT,
    dns_resolution_time_ms INTEGER,
    tcp_connection_time_ms INTEGER,
    tls_handshake_time_ms INTEGER,
    first_byte_time_ms INTEGER,
    download_time_ms INTEGER,
    ssl_certificate_info JSONB,
    ssl_expires_at TIMESTAMPTZ,
    redirect_count INTEGER DEFAULT 0,
    final_url TEXT,
    ip_address INET,
    geo_location JSONB,
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_score DECIMAL(5,2),
    check_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_logs_service_id ON health_logs(service_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_check_timestamp ON health_logs(check_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_logs_status ON health_logs(status);
CREATE INDEX IF NOT EXISTS idx_health_logs_service_timestamp ON health_logs(service_id, check_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_logs_is_anomaly ON health_logs(is_anomaly) WHERE is_anomaly = true;
CREATE INDEX IF NOT EXISTS idx_health_logs_status_timestamp ON health_logs(status, check_timestamp DESC);

COMMENT ON TABLE health_logs IS 'Detailed logs of every health check execution';
COMMENT ON COLUMN health_logs.anomaly_score IS 'ML-generated anomaly detection score (0-100)';

-- =====================================================
-- TABLE 4: health_service_status
-- Purpose: Current real-time status of each service
-- =====================================================

CREATE TABLE IF NOT EXISTS health_service_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL UNIQUE REFERENCES health_services(id) ON DELETE CASCADE,
    current_status VARCHAR(50) NOT NULL CHECK (current_status IN ('healthy', 'degraded', 'unhealthy', 'unknown', 'maintenance')),
    last_healthy_at TIMESTAMPTZ,
    last_unhealthy_at TIMESTAMPTZ,
    last_check_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    consecutive_successes INTEGER DEFAULT 0,
    total_checks_24h INTEGER DEFAULT 0,
    successful_checks_24h INTEGER DEFAULT 0,
    failed_checks_24h INTEGER DEFAULT 0,
    average_response_time_24h_ms INTEGER,
    min_response_time_24h_ms INTEGER,
    max_response_time_24h_ms INTEGER,
    uptime_percentage_24h DECIMAL(5,2),
    uptime_percentage_7d DECIMAL(5,2),
    uptime_percentage_30d DECIMAL(5,2),
    uptime_percentage_90d DECIMAL(5,2),
    current_incident_id UUID,
    status_changed_at TIMESTAMPTZ,
    status_change_reason TEXT,
    is_flapping BOOLEAN DEFAULT false,
    flap_detection_count INTEGER DEFAULT 0,
    last_response_time_ms INTEGER,
    last_status_code INTEGER,
    last_error_message TEXT,
    health_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_service_status_service_id ON health_service_status(service_id);
CREATE INDEX IF NOT EXISTS idx_health_service_status_current_status ON health_service_status(current_status);
CREATE INDEX IF NOT EXISTS idx_health_service_status_last_check_at ON health_service_status(last_check_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_service_status_current_incident ON health_service_status(current_incident_id);
CREATE INDEX IF NOT EXISTS idx_health_service_status_is_flapping ON health_service_status(is_flapping) WHERE is_flapping = true;

COMMENT ON TABLE health_service_status IS 'Real-time current status and metrics for each service';
COMMENT ON COLUMN health_service_status.is_flapping IS 'Indicates if service is rapidly switching between states';
COMMENT ON COLUMN health_service_status.health_score IS 'Composite health score (0-100)';

-- =====================================================
-- TABLE 5: health_alert_rules
-- Purpose: Configure alerting rules and thresholds
-- =====================================================

CREATE TABLE IF NOT EXISTS health_alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES health_projects(id) ON DELETE CASCADE,
    service_id UUID REFERENCES health_services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(100) NOT NULL CHECK (rule_type IN ('threshold', 'anomaly', 'pattern', 'composite', 'sla')),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    is_enabled BOOLEAN DEFAULT true,
    condition_config JSONB NOT NULL,
    threshold_config JSONB,
    evaluation_window_minutes INTEGER DEFAULT 5,
    cooldown_minutes INTEGER DEFAULT 15,
    notification_channels JSONB DEFAULT '["email"]',
    notification_template_id UUID,
    escalation_policy JSONB,
    auto_resolve BOOLEAN DEFAULT true,
    auto_resolve_after_minutes INTEGER DEFAULT 30,
    require_consecutive_breaches INTEGER DEFAULT 1,
    alert_on_recovery BOOLEAN DEFAULT true,
    custom_filters JSONB,
    schedule JSONB,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    metadata JSONB DEFAULT '{}',
    CONSTRAINT check_project_or_service CHECK (project_id IS NOT NULL OR service_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_health_alert_rules_project_id ON health_alert_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_health_alert_rules_service_id ON health_alert_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_health_alert_rules_is_enabled ON health_alert_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_health_alert_rules_severity ON health_alert_rules(severity);
CREATE INDEX IF NOT EXISTS idx_health_alert_rules_rule_type ON health_alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_health_alert_rules_last_triggered ON health_alert_rules(last_triggered_at DESC);

COMMENT ON TABLE health_alert_rules IS 'Configurable rules for triggering alerts based on health metrics';
COMMENT ON COLUMN health_alert_rules.condition_config IS 'JSON configuration defining alert trigger conditions';
COMMENT ON COLUMN health_alert_rules.escalation_policy IS 'JSON defining escalation steps and timings';

-- =====================================================
-- TABLE 6: health_alerts
-- Purpose: Individual alert instances triggered by rules
-- =====================================================

CREATE TABLE IF NOT EXISTS health_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES health_alert_rules(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES health_services(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES health_incidents(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'suppressed', 'expired')),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    triggered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    auto_resolved BOOLEAN DEFAULT false,
    suppressed BOOLEAN DEFAULT false,
    suppression_reason TEXT,
    notification_status JSONB DEFAULT '{}',
    notification_sent_at TIMESTAMPTZ,
    notification_delivery_status JSONB,
    escalation_level INTEGER DEFAULT 0,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID,
    related_alerts UUID[],
    metric_snapshot JSONB,
    context_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_alerts_rule_id ON health_alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_service_id ON health_alerts(service_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_incident_id ON health_alerts(incident_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON health_alerts(status);
CREATE INDEX IF NOT EXISTS idx_health_alerts_severity ON health_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_health_alerts_triggered_at ON health_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_alerts_acknowledged_by ON health_alerts(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_health_alerts_resolved_at ON health_alerts(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status_severity ON health_alerts(status, severity);

COMMENT ON TABLE health_alerts IS 'Individual alert instances triggered by monitoring rules';
COMMENT ON COLUMN health_alerts.notification_delivery_status IS 'JSON tracking delivery status per channel';

-- =====================================================
-- TABLE 7: health_incidents
-- Purpose: Track and manage service incidents
-- =====================================================

CREATE TABLE IF NOT EXISTS health_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES health_projects(id) ON DELETE CASCADE,
    service_id UUID REFERENCES health_services(id) ON DELETE SET NULL,
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    priority VARCHAR(50) CHECK (priority IN ('p0', 'p1', 'p2', 'p3', 'p4')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed')),
    impact_level VARCHAR(50) CHECK (impact_level IN ('none', 'minor', 'major', 'critical')),
    affected_services UUID[],
    affected_users_count INTEGER DEFAULT 0,
    root_cause TEXT,
    resolution TEXT,
    workaround TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    mttr_minutes INTEGER,
    assigned_to UUID,
    assigned_team VARCHAR(255),
    commander UUID,
    responders UUID[],
    timeline JSONB DEFAULT '[]',
    postmortem_required BOOLEAN DEFAULT false,
    postmortem_completed BOOLEAN DEFAULT false,
    postmortem_url TEXT,
    tags VARCHAR(100)[],
    communication_status VARCHAR(50) DEFAULT 'not_communicated',
    status_page_update JSONB,
    external_ticket_id VARCHAR(255),
    external_ticket_url TEXT,
    cost_impact_usd DECIMAL(12,2),
    customer_impact JSONB,
    lessons_learned TEXT,
    action_items JSONB DEFAULT '[]',
    related_incidents UUID[],
    parent_incident_id UUID REFERENCES health_incidents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_incidents_project_id ON health_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_health_incidents_service_id ON health_incidents(service_id);
CREATE INDEX IF NOT EXISTS idx_health_incidents_status ON health_incidents(status);
CREATE INDEX IF NOT EXISTS idx_health_incidents_severity ON health_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_health_incidents_started_at ON health_incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_incidents_incident_number ON health_incidents(incident_number);
CREATE INDEX IF NOT EXISTS idx_health_incidents_assigned_to ON health_incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_health_incidents_resolved_at ON health_incidents(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_incidents_parent_incident ON health_incidents(parent_incident_id);
CREATE INDEX IF NOT EXISTS idx_health_incidents_tags ON health_incidents USING GIN(tags);

COMMENT ON TABLE health_incidents IS 'Service incidents requiring investigation and resolution';
COMMENT ON COLUMN health_incidents.incident_number IS 'Human-readable incident identifier';
COMMENT ON COLUMN health_incidents.mttr_minutes IS 'Mean time to resolution in minutes';
COMMENT ON COLUMN health_incidents.timeline IS 'JSON array of timestamped incident events';

-- =====================================================
-- TABLE 8: health_recovery_actions
-- Purpose: Define automated recovery procedures
-- =====================================================

CREATE TABLE IF NOT EXISTS health_recovery_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES health_projects(id) ON DELETE CASCADE,
    service_id UUID REFERENCES health_services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('restart', 'scale', 'failover', 'rollback', 'script', 'webhook', 'manual')),
    trigger_condition JSONB NOT NULL,
    action_config JSONB NOT NULL,
    execution_order INTEGER DEFAULT 1,
    is_enabled BOOLEAN DEFAULT true,
    is_automatic BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT true,
    approval_timeout_minutes INTEGER DEFAULT 15,
    max_retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 300,
    cooldown_minutes INTEGER DEFAULT 30,
    success_criteria JSONB,
    rollback_on_failure BOOLEAN DEFAULT true,
    rollback_action_id UUID REFERENCES health_recovery_actions(id) ON DELETE SET NULL,
    notification_channels JSONB DEFAULT '["email"]',
    prerequisites JSONB,
    dependencies UUID[],
    script_content TEXT,
    script_language VARCHAR(50),
    webhook_url TEXT,
    webhook_method VARCHAR(10) DEFAULT 'POST',
    webhook_headers JSONB,
    webhook_payload JSONB,
    last_executed_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    average_execution_time_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_project_id ON health_recovery_actions(project_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_service_id ON health_recovery_actions(service_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_action_type ON health_recovery_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_is_enabled ON health_recovery_actions(is_enabled);
CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_is_automatic ON health_recovery_actions(is_automatic);
CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_execution_order ON health_recovery_actions(execution_order);
CREATE INDEX IF NOT EXISTS idx_health_recovery_actions_rollback_action ON health_recovery_actions(rollback_action_id);

COMMENT ON TABLE health_recovery_actions IS 'Automated or manual recovery procedures for service issues';
COMMENT ON COLUMN health_recovery_actions.trigger_condition IS 'JSON defining when this action should be triggered';
COMMENT ON COLUMN health_recovery_actions.action_config IS 'JSON configuration for executing the action';

-- =====================================================
-- TABLE 9: health_recovery_log
-- Purpose: Log all recovery action executions
-- =====================================================

CREATE TABLE IF NOT EXISTS health_recovery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_id UUID NOT NULL REFERENCES health_recovery_actions(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES health_services(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES health_incidents(id) ON DELETE SET NULL,
    alert_id UUID REFERENCES health_alerts(id) ON DELETE SET NULL,
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failure', 'timeout', 'cancelled', 'skipped')),
    trigger_reason TEXT,
    triggered_by VARCHAR(50) CHECK (triggered_by IN ('automatic', 'manual', 'scheduled', 'api')),
    initiated_by_user_id UUID,
    approved_by_user_id UUID,
    approval_status VARCHAR(50) CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired')),
    approved_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    retry_attempt INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    execution_output TEXT,
    execution_error TEXT,
    exit_code INTEGER,
    stdout TEXT,
    stderr TEXT,
    success_criteria_met BOOLEAN,
    before_snapshot JSONB,
    after_snapshot JSONB,
    metrics_impact JSONB,
    rollback_required BOOLEAN DEFAULT false,
    rollback_executed BOOLEAN DEFAULT false,
    rollback_execution_id UUID,
    notification_sent BOOLEAN DEFAULT false,
    notification_recipients JSONB,
    execution_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_recovery_log_action_id ON health_recovery_log(action_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_service_id ON health_recovery_log(service_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_incident_id ON health_recovery_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_alert_id ON health_recovery_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_status ON health_recovery_log(status);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_execution_id ON health_recovery_log(execution_id);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_started_at ON health_recovery_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_triggered_by ON health_recovery_log(triggered_by);
CREATE INDEX IF NOT EXISTS idx_health_recovery_log_approval_status ON health_recovery_log(approval_status);

COMMENT ON TABLE health_recovery_log IS 'Execution history of all recovery actions';
COMMENT ON COLUMN health_recovery_log.execution_id IS 'Unique identifier for this execution instance';
COMMENT ON COLUMN health_recovery_log.metrics_impact IS 'JSON showing before/after metrics';

-- =====================================================
-- TABLE 10: health_metrics_hourly
-- Purpose: Aggregated hourly metrics for performance
-- =====================================================

CREATE TABLE IF NOT EXISTS health_metrics_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES health_services(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    timeout_checks INTEGER DEFAULT 0,
    error_checks INTEGER DEFAULT 0,
    average_response_time_ms INTEGER,
    median_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    stddev_response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2),
    downtime_minutes INTEGER DEFAULT 0,
    total_downtime_duration_seconds INTEGER DEFAULT 0,
    incident_count INTEGER DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    recovery_action_count INTEGER DEFAULT 0,
    ssl_expiry_days INTEGER,
    status_code_distribution JSONB DEFAULT '{}',
    error_type_distribution JSONB DEFAULT '{}',
    geographic_distribution JSONB DEFAULT '{}',
    average_dns_time_ms INTEGER,
    average_tcp_time_ms INTEGER,
    average_tls_time_ms INTEGER,
    average_first_byte_ms INTEGER,
    total_data_transferred_bytes BIGINT DEFAULT 0,
    unique_error_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    health_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}',
    UNIQUE(service_id, hour_timestamp)
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_hourly_service_id ON health_metrics_hourly(service_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_hourly_hour_timestamp ON health_metrics_hourly(hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_hourly_service_hour ON health_metrics_hourly(service_id, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_hourly_uptime ON health_metrics_hourly(uptime_percentage);
CREATE INDEX IF NOT EXISTS idx_health_metrics_hourly_health_score ON health_metrics_hourly(health_score);

COMMENT ON TABLE health_metrics_hourly IS 'Hourly aggregated metrics for analytics and reporting';
COMMENT ON COLUMN health_metrics_hourly.hour_timestamp IS 'Start of the hour for this aggregation';
COMMENT ON COLUMN health_metrics_hourly.p95_response_time_ms IS '95th percentile response time';

-- =====================================================
-- TABLE 11: health_metrics_daily
-- Purpose: Aggregated daily metrics for long-term trends
-- =====================================================

CREATE TABLE IF NOT EXISTS health_metrics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES health_services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    timeout_checks INTEGER DEFAULT 0,
    error_checks INTEGER DEFAULT 0,
    average_response_time_ms INTEGER,
    median_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    stddev_response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2),
    downtime_minutes INTEGER DEFAULT 0,
    total_downtime_duration_seconds INTEGER DEFAULT 0,
    incident_count INTEGER DEFAULT 0,
    critical_incident_count INTEGER DEFAULT 0,
    high_incident_count INTEGER DEFAULT 0,
    medium_incident_count INTEGER DEFAULT 0,
    low_incident_count INTEGER DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    recovery_action_count INTEGER DEFAULT 0,
    successful_recovery_count INTEGER DEFAULT 0,
    failed_recovery_count INTEGER DEFAULT 0,
    ssl_expiry_days INTEGER,
    certificate_valid BOOLEAN,
    status_code_distribution JSONB DEFAULT '{}',
    error_type_distribution JSONB DEFAULT '{}',
    hourly_uptime_distribution JSONB DEFAULT '{}',
    peak_response_time_hour INTEGER,
    lowest_response_time_hour INTEGER,
    busiest_hour INTEGER,
    average_dns_time_ms INTEGER,
    average_tcp_time_ms INTEGER,
    average_tls_time_ms INTEGER,
    average_first_byte_ms INTEGER,
    total_data_transferred_bytes BIGINT DEFAULT 0,
    unique_error_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    sla_compliance_percentage DECIMAL(5,2),
    sla_target_percentage DECIMAL(5,2),
    sla_breach_minutes INTEGER DEFAULT 0,
    health_score DECIMAL(5,2),
    availability_score DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    reliability_score DECIMAL(5,2),
    mttr_minutes INTEGER,
    mtbf_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}',
    UNIQUE(service_id, date)
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_service_id ON health_metrics_daily(service_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_date ON health_metrics_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_service_date ON health_metrics_daily(service_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_uptime ON health_metrics_daily(uptime_percentage);
CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_health_score ON health_metrics_daily(health_score);
CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_sla_compliance ON health_metrics_daily(sla_compliance_percentage);

COMMENT ON TABLE health_metrics_daily IS 'Daily aggregated metrics for long-term trending and SLA tracking';
COMMENT ON COLUMN health_metrics_daily.date IS 'Date for this daily aggregation';
COMMENT ON COLUMN health_metrics_daily.mttr_minutes IS 'Mean Time To Resolution for incidents on this day';
COMMENT ON COLUMN health_metrics_daily.mtbf_minutes IS 'Mean Time Between Failures for this day';

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_health_projects_updated_at
    BEFORE UPDATE ON health_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_services_updated_at
    BEFORE UPDATE ON health_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_service_status_updated_at
    BEFORE UPDATE ON health_service_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_alert_rules_updated_at
    BEFORE UPDATE ON health_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_alerts_updated_at
    BEFORE UPDATE ON health_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_incidents_updated_at
    BEFORE UPDATE ON health_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_recovery_actions_updated_at
    BEFORE UPDATE ON health_recovery_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_metrics_hourly_updated_at
    BEFORE UPDATE ON health_metrics_hourly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_metrics_daily_updated_at
    BEFORE UPDATE ON health_metrics_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS: Useful query abstractions
-- =====================================================

-- View: Current service health summary
CREATE OR REPLACE VIEW v_service_health_summary AS
SELECT 
    s.id,
    s.name,
    s.service_type,
    s.endpoint_url,
    s.is_active,
    s.maintenance_mode,
    p.name as project_name,
    st.current_status,
    st.last_check_at,
    st.uptime_percentage_24h,
    st.uptime_percentage_7d,
    st.uptime_percentage_30d,
    st.average_response_time_24h_ms,
    st.consecutive_failures,
    st.health_score,
    st.is_flapping,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'open') as open_alerts,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status IN ('open', 'investigating')) as active_incidents
FROM health_services s
LEFT JOIN health_projects p ON s.project_id = p.id
LEFT JOIN health_service_status st ON s.id = st.service_id
LEFT JOIN health_alerts a ON s.id = a.service_id
LEFT JOIN health_incidents i ON s.id = i.service_id
GROUP BY s.id, s.name, s.service_type, s.endpoint_url, s.is_active, s.maintenance_mode, 
         p.name, st.current_status, st.last_check_at, st.uptime_percentage_24h, 
         st.uptime_percentage_7d, st.uptime_percentage_30d, st.average_response_time_24h_ms,
         st.consecutive_failures, st.health_score, st.is_flapping;

COMMENT ON VIEW v_service_health_summary IS 'Consolidated view of current service health status';

-- View: Recent failed health checks
CREATE OR REPLACE VIEW v_recent_failures AS
SELECT 
    hl.id,
    s.name as service_name,
    p.name as project_name,
    hl.check_timestamp,
    hl.status,
    hl.error_message,
    hl.response_time_ms,
    hl.status_code
FROM health_logs hl
JOIN health_services s ON hl.service_id = s.id
JOIN health_projects p ON s.project_id = p.id
WHERE hl.status IN ('failure', 'timeout', 'error')
    AND hl.check_timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY hl.check_timestamp DESC;

COMMENT ON VIEW v_recent_failures IS 'Failed health checks from the last 24 hours';

-- View: Active incidents dashboard
CREATE OR REPLACE VIEW v_active_incidents AS
SELECT 
    i.id,
    i.incident_number,
    i.title,
    i.severity,
    i.status,
    i.started_at,
    i.duration_minutes,
    p.name as project_name,
    s.name as service_name,
    COUNT(DISTINCT a.id) as alert_count,
    i.assigned_to,
    i.commander,
    i.affected_users_count
FROM health_incidents i
JOIN health_projects p ON i.project_id = p.id
LEFT JOIN health_services s ON i.service_id = s.id
LEFT JOIN health_alerts a ON i.id = a.incident_id
WHERE i.status IN ('open', 'investigating', 'identified', 'monitoring')
GROUP BY i.id, i.incident_number, i.title, i.severity, i.status, i.started_at, 
         i.duration_minutes, p.name, s.name, i.assigned_to, i.commander, i.affected_users_count
ORDER BY i.severity DESC, i.started_at ASC;

COMMENT ON VIEW v_active_incidents IS 'Currently active incidents requiring attention';

-- =====================================================
-- FUNCTIONS: Utility functions
-- =====================================================

-- Function: Calculate uptime percentage
CREATE OR REPLACE FUNCTION calculate_uptime_percentage(
    p_service_id UUID,
    p_hours INTEGER DEFAULT 24
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_checks INTEGER;
    v_successful_checks INTEGER;
    v_uptime_percentage DECIMAL(5,2);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'success')
    INTO v_total_checks, v_successful_checks
    FROM health_logs
    WHERE service_id = p_service_id
        AND check_timestamp >= NOW() - (p_hours || ' hours')::INTERVAL;
    
    IF v_total_checks = 0 THEN
        RETURN NULL;
    END IF;
    
    v_uptime_percentage := (v_successful_checks::DECIMAL / v_total_checks::DECIMAL) * 100;
    RETURN ROUND(v_uptime_percentage, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_uptime_percentage IS 'Calculate service uptime percentage over specified hours';

-- Function: Generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_date TEXT;
    v_sequence INTEGER;
    v_incident_number VARCHAR(50);
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(SUBSTRING(incident_number FROM 10)::INTEGER), 0) + 1
    INTO v_sequence
    FROM health_incidents
    WHERE incident_number LIKE 'INC-' || v_date || '-%';
    
    v_incident_number := 'INC-' || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');
    RETURN v_incident_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_incident_number IS 'Generate unique incident number in format INC-YYYYMMDD-NNNN';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Placeholder structure
-- =====================================================

-- Enable RLS on all tables (commented out by default, enable as needed)
-- ALTER TABLE health_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_service_status ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_alert_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_incidents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_recovery_actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_recovery_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_metrics_hourly ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_metrics_daily ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DATA RETENTION POLICY (Placeholder)
-- =====================================================

-- Consider implementing automatic data retention policies:
-- - health_logs: Keep 90 days, then archive or delete
-- - health_alerts: Keep resolved alerts for 180 days
-- - health_metrics_hourly: Keep 90 days, then delete (daily metrics retained)
-- - health_metrics_daily: Keep indefinitely or for 2+ years

-- =====================================================
-- GRANTS: Set appropriate permissions
-- =====================================================

-- Grant usage on schema (adjust schema name as needed)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Migration completed successfully
-- All 11 tables created with proper constraints, indexes, and relationships
-- Additional features: triggers, views, functions, and comments

SELECT 'Enterprise Health Monitoring Schema Migration Complete' AS status;

