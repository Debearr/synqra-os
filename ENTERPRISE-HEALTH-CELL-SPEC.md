# Enterprise Health Cell System - Complete Specification

**Version:** 1.0.0
**Created:** 2025-11-06
**Project:** Synqra OS / NØID Labs / AuraFX Infrastructure Monitoring

## Executive Summary

The Enterprise Health Cell System is a comprehensive, production-ready infrastructure monitoring and recovery platform designed to monitor Supabase services across three major projects: Synqra OS, NØID Labs, and AuraFX. It provides real-time health monitoring, intelligent alerting, automated recovery, and enterprise-grade dashboards with zero placeholders.

## System Architecture

### Components Overview

```
Enterprise Health Cell System
├── Database Layer (PostgreSQL/Supabase)
│   ├── Health monitoring tables
│   ├── Alert management tables
│   ├── Incident tracking tables
│   ├── Recovery automation tables
│   └── Metrics aggregation tables
│
├── Monitoring Engine (Node.js)
│   ├── enterprise-health-monitor.mjs - Main health check engine
│   ├── Multi-service health checks
│   ├── Response time tracking
│   ├── Failure detection and retry logic
│   └── Alert triggering
│
├── Recovery Automation (Node.js)
│   ├── recovery-automation.mjs - Automated recovery system
│   ├── Service failure detection
│   ├── Auto-restart procedures
│   ├── Escalation handling
│   └── Incident management
│
├── Enterprise Dashboard (Next.js 14)
│   ├── Real-time status visualization
│   ├── Performance metrics charts
│   ├── Alert management UI
│   ├── Incident timeline
│   └── Service drill-down views
│
├── API Layer (Next.js API Routes)
│   ├── /api/health/overview - System-wide status
│   ├── /api/health/status - Service status
│   ├── /api/health/metrics - Time-series data
│   ├── /api/health/alerts - Alert management
│   └── /api/health/incidents - Incident tracking
│
└── Automation Layer (GitHub Actions)
    ├── Scheduled health checks (every 5 minutes)
    ├── Hourly metrics aggregation
    ├── Daily metrics rollup
    └── Recovery automation (every 15 minutes)
```

## Database Schema

### Core Tables

#### health_projects
Stores configuration for each monitored project.

```sql
- id (UUID, PK)
- project_key (ENUM: synqra_os, noid_labs, aurafx, shared)
- display_name (TEXT)
- description (TEXT)
- supabase_url (TEXT)
- owner_email (TEXT)
- notification_emails (TEXT[])
- is_active (BOOLEAN)
- config (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

#### health_services
Defines services to monitor within each project.

```sql
- id (UUID, PK)
- project_id (UUID, FK → health_projects)
- service_key (ENUM: postgres, rest_api, auth, storage, realtime, n8n, external)
- display_name (TEXT)
- description (TEXT)
- endpoint_url (TEXT)
- check_interval_seconds (INTEGER) - Default: 300
- timeout_ms (INTEGER) - Default: 10000
- retry_count (INTEGER) - Default: 3
- is_active (BOOLEAN)
- thresholds (JSONB) - Response time & error rate thresholds
- config (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

#### health_logs
Detailed logs of every health check performed.

```sql
- id (UUID, PK)
- check_id (TEXT) - Unique identifier for each check
- service_id (UUID, FK → health_services)
- status (ENUM: healthy, degraded, critical, unknown)
- response_time_ms (INTEGER)
- attempt_number (INTEGER)
- message (TEXT)
- error_stack (TEXT)
- metadata (JSONB)
- timestamp (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

#### health_service_status
Current status rollup for each service (updated by trigger).

```sql
- id (UUID, PK)
- service_id (UUID, FK → health_services, UNIQUE)
- current_status (ENUM: healthy, degraded, critical, unknown)
- last_check_at (TIMESTAMPTZ)
- last_success_at (TIMESTAMPTZ)
- last_failure_at (TIMESTAMPTZ)
- consecutive_failures (INTEGER)
- consecutive_successes (INTEGER)
- avg_response_time_ms (DECIMAL)
- uptime_percentage (DECIMAL)
- total_checks (INTEGER)
- successful_checks (INTEGER)
- failed_checks (INTEGER)
- last_error_message (TEXT)
- updated_at (TIMESTAMPTZ)
```

### Alerting Tables

#### health_alert_rules
Configurable alert rules for each service.

```sql
- id (UUID, PK)
- service_id (UUID, FK → health_services)
- rule_name (TEXT)
- description (TEXT)
- condition_type (TEXT: consecutive_failures, response_time, error_rate, uptime, custom)
- condition_config (JSONB) - Thresholds and parameters
- severity (ENUM: info, warning, error, critical)
- notification_channels (TEXT[]) - e.g., ['n8n', 'email']
- cooldown_minutes (INTEGER) - Default: 30
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### health_alerts
Active and historical alerts.

```sql
- id (UUID, PK)
- alert_rule_id (UUID, FK → health_alert_rules)
- service_id (UUID, FK → health_services)
- severity (ENUM: info, warning, error, critical)
- status (ENUM: active, acknowledged, resolved, suppressed)
- title (TEXT)
- message (TEXT)
- triggered_at (TIMESTAMPTZ)
- acknowledged_at (TIMESTAMPTZ)
- acknowledged_by (TEXT)
- resolved_at (TIMESTAMPTZ)
- resolved_by (TEXT)
- resolution_notes (TEXT)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

#### health_alert_notifications
Log of all notification attempts.

```sql
- id (UUID, PK)
- alert_id (UUID, FK → health_alerts)
- channel (TEXT) - e.g., 'n8n', 'email'
- recipient (TEXT)
- payload (JSONB)
- sent_at (TIMESTAMPTZ)
- status (TEXT: pending, sent, failed, retrying)
- error_message (TEXT)
- retry_count (INTEGER)
- created_at (TIMESTAMPTZ)
```

### Incident Management Tables

#### health_incidents
Major incidents requiring investigation.

```sql
- id (UUID, PK)
- incident_number (SERIAL, UNIQUE)
- title (TEXT)
- description (TEXT)
- severity (ENUM: info, warning, error, critical)
- status (ENUM: investigating, identified, monitoring, resolved)
- service_id (UUID, FK → health_services)
- affected_services (UUID[])
- started_at (TIMESTAMPTZ)
- detected_at (TIMESTAMPTZ)
- resolved_at (TIMESTAMPTZ)
- duration_minutes (INTEGER)
- impact_description (TEXT)
- root_cause (TEXT)
- resolution_summary (TEXT)
- assigned_to (TEXT)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

#### health_incident_updates
Timeline of incident updates.

```sql
- id (UUID, PK)
- incident_id (UUID, FK → health_incidents)
- update_type (TEXT: investigating, identified, update, monitoring, resolved)
- message (TEXT)
- created_by (TEXT)
- is_public (BOOLEAN) - For status pages
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

### Recovery Automation Tables

#### health_recovery_actions
Configured recovery actions for services.

```sql
- id (UUID, PK)
- service_id (UUID, FK → health_services)
- action_name (TEXT)
- action_type (ENUM: auto_restart, manual_intervention, escalate, notify_only)
- trigger_condition (TEXT) - e.g., "consecutive_failures >= 3"
- action_config (JSONB) - Action-specific parameters
- max_retries (INTEGER) - Default: 3
- retry_delay_seconds (INTEGER) - Default: 60
- is_enabled (BOOLEAN)
- priority (INTEGER) - Lower = higher priority
- created_at, updated_at (TIMESTAMPTZ)
```

#### health_recovery_log
Execution log of all recovery actions.

```sql
- id (UUID, PK)
- recovery_action_id (UUID, FK → health_recovery_actions)
- service_id (UUID, FK → health_services)
- incident_id (UUID, FK → health_incidents)
- action_type (ENUM: auto_restart, manual_intervention, escalate, notify_only)
- status (TEXT: pending, running, success, failed, cancelled)
- started_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
- duration_seconds (INTEGER)
- result_message (TEXT)
- error_details (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

### Metrics Tables

#### health_metrics_hourly
Hourly aggregated metrics (updated by scheduled function).

```sql
- id (UUID, PK)
- service_id (UUID, FK → health_services)
- hour_start (TIMESTAMPTZ)
- total_checks (INTEGER)
- successful_checks (INTEGER)
- failed_checks (INTEGER)
- avg_response_time_ms (DECIMAL)
- min_response_time_ms (INTEGER)
- max_response_time_ms (INTEGER)
- p50_response_time_ms (INTEGER)
- p95_response_time_ms (INTEGER)
- p99_response_time_ms (INTEGER)
- uptime_percentage (DECIMAL)
- downtime_minutes (INTEGER)
- created_at (TIMESTAMPTZ)
- UNIQUE(service_id, hour_start)
```

#### health_metrics_daily
Daily aggregated metrics (updated by scheduled function).

```sql
- id (UUID, PK)
- service_id (UUID, FK → health_services)
- date (DATE)
- total_checks (INTEGER)
- successful_checks (INTEGER)
- failed_checks (INTEGER)
- avg_response_time_ms (DECIMAL)
- min_response_time_ms (INTEGER)
- max_response_time_ms (INTEGER)
- uptime_percentage (DECIMAL)
- downtime_minutes (INTEGER)
- incidents_count (INTEGER)
- alerts_count (INTEGER)
- created_at (TIMESTAMPTZ)
- UNIQUE(service_id, date)
```

## Monitoring Engine

### Health Check Process

```
1. Fetch active services from database
2. For each service:
   a. Execute service-specific health check
   b. Measure response time
   c. Determine health status (healthy/degraded/critical)
   d. Log result to database
   e. Trigger updates service status via database trigger
   f. Check alert conditions
   g. Create alerts if thresholds exceeded
3. Aggregate metrics (hourly/daily)
4. Exit with appropriate code (0 = success, 1 = failures)
```

### Service-Specific Checks

#### PostgreSQL
- Query: `SELECT id FROM health_logs LIMIT 1`
- Success: Query completes successfully
- Failure: Connection error, timeout, or query error

#### REST API
- Endpoint: `{SUPABASE_URL}/rest/v1/`
- Method: GET with service role auth
- Success: HTTP 200, non-empty response body
- Degraded: Slow response time (> 2s)
- Critical: HTTP error, timeout, or empty response

#### Auth
- Endpoint: `{SUPABASE_URL}/auth/v1/health`
- Method: GET
- Success: HTTP 200
- Critical: HTTP error or timeout

#### Storage
- Endpoint: `{SUPABASE_URL}/storage/v1/bucket`
- Method: GET with auth
- Success: HTTP 200
- Degraded: HTTP error (not critical for operations)

#### Realtime
- Falls back to REST API check (no dedicated endpoint)

#### N8N
- Endpoint: N8N_WEBHOOK_URL
- Method: POST with health check payload
- Success: HTTP 200
- Degraded: HTTP error or timeout (not critical)

### Retry Logic

```javascript
For attempt = 1 to MAX_RETRIES (default: 3):
  result = performHealthCheck(service, attempt)
  if result.status === "healthy":
    return SUCCESS

  if attempt < MAX_RETRIES:
    wait_time = BASE_DELAY * 2^(attempt - 1) + random(0, 1000)ms
    sleep(wait_time)

return FAILURE
```

## Recovery Automation

### Recovery Flow

```
1. Every 60 seconds:
   a. Query services with status = degraded/critical
   b. Filter services with consecutive_failures >= 3
   c. Filter services with enabled recovery actions

2. For each service needing recovery:
   a. Create or get existing incident
   b. Get recovery actions sorted by priority
   c. For each action:
      i. Execute action (auto_restart, escalate, etc.)
      ii. Log execution result
      iii. Send notifications
      iv. Break if action succeeds (unless notify_only)

3. Update incident status based on results
```

### Recovery Action Types

#### auto_restart
- Wait for configured time (default: 5000ms)
- Trigger new health check
- Next check will verify recovery
- Success: Logged and monitored
- Failure: Escalate to next action

#### manual_intervention
- Create high-priority notification
- Update incident with assignment
- Notify on-call engineers
- Wait for manual resolution

#### escalate
- Update incident severity to "critical"
- Change incident status to "identified"
- Send escalation notifications
- Add incident update with urgency flag

#### notify_only
- Send informational notification
- Log the event
- No action taken
- Continue to next recovery action

## Dashboard Features

### Overview Page

**Key Metrics**
- Total services count
- Healthy/Degraded/Critical breakdown
- Overall health percentage
- Average uptime (24h)
- Average response time
- Active alerts count
- Active incidents count

**Project Cards**
- Service health visualization
- Average uptime per project
- Quick status indicators
- Service breakdown tags

**Alerts Panel**
- Real-time active alerts
- Severity indicators (Critical/Error/Warning/Info)
- Time since triggered
- Acknowledgment status
- Service and project context

**Service Status Grid**
- Individual service cards
- Status icons (healthy/degraded/critical/unknown)
- Uptime percentage
- Response time
- Last check timestamp
- Click for detailed modal

**Performance Metrics**
- 24-hour uptime chart
- Response time trends
- Service selector dropdown
- Hourly granularity
- Summary statistics

**Incidents Timeline**
- Chronological incident list
- Status indicators (investigating/identified/monitoring/resolved)
- Duration tracking
- Impact assessment
- Resolution summaries

### Real-time Updates

- WebSocket subscription to `health_logs` table
- WebSocket subscription to `health_alerts` table
- Auto-refresh every 30 seconds
- Live status updates
- No page reload required

## API Endpoints

### GET /api/health/overview
Returns complete system overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_services": 12,
      "healthy_services": 11,
      "degraded_services": 1,
      "critical_services": 0,
      "unknown_services": 0,
      "overall_health_percentage": 91.67,
      "avg_uptime": 99.85,
      "avg_response_time_ms": 245,
      "active_alerts": 2,
      "active_incidents": 0
    },
    "projects": {...},
    "services": [...]
  },
  "timestamp": "2025-11-06T..."
}
```

### GET /api/health/status
Returns service status with optional filtering.

**Query Parameters:**
- `project` - Filter by project key
- `service` - Filter by service key

### GET /api/health/metrics
Returns time-series metrics data.

**Query Parameters:**
- `service_id` - Required
- `period` - 24h, 7d, 30d (default: 24h)
- `granularity` - hourly, daily (default: hourly)

### GET /api/health/alerts
Returns alerts with filtering.

**Query Parameters:**
- `status` - active, acknowledged, resolved
- `severity` - critical, error, warning, info
- `limit` - Max results (default: 50)

### PATCH /api/health/alerts
Updates alert status.

**Body:**
```json
{
  "alert_id": "uuid",
  "status": "acknowledged|resolved",
  "resolution_notes": "Optional notes"
}
```

### GET /api/health/incidents
Returns incident list.

**Query Parameters:**
- `status` - investigating, identified, monitoring, resolved
- `limit` - Max results (default: 20)

### POST /api/health/incidents
Creates manual incident.

**Body:**
```json
{
  "title": "Incident title",
  "description": "Description",
  "severity": "critical|error|warning|info",
  "service_id": "uuid",
  "affected_services": ["uuid1", "uuid2"],
  "impact_description": "Impact details"
}
```

## GitHub Actions Workflows

### Health Check Job
- **Schedule:** Every 5 minutes (`*/5 * * * *`)
- **Trigger:** Manual, push to main/claude branches
- **Timeout:** 10 minutes
- **Steps:**
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies
  4. Run enterprise-health-monitor.mjs
  5. Aggregate hourly metrics
  6. Upload logs on failure

### Recovery Automation Job
- **Schedule:** Every 15 minutes (`*/15 * * * *`)
- **Timeout:** 15 minutes
- **Steps:**
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies
  4. Run recovery-automation.mjs
  5. Upload recovery logs

### Daily Aggregation Job
- **Schedule:** Daily at midnight UTC (`0 0 * * *`)
- **Steps:**
  1. Aggregate daily metrics
  2. Cleanup old logs (30 day retention)

## Configuration

### Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/health
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Service Thresholds

```json
{
  "response_time_warning_ms": 2000,
  "response_time_critical_ms": 5000,
  "error_rate_warning": 0.05,
  "error_rate_critical": 0.1
}
```

### Alert Rule Example

```sql
INSERT INTO health_alert_rules (
  service_id,
  rule_name,
  condition_type,
  condition_config,
  severity,
  notification_channels
) VALUES (
  'service-uuid',
  'High Response Time',
  'response_time',
  '{"threshold_ms": 2000}',
  'warning',
  ARRAY['n8n', 'email']
);
```

## Deployment

### Database Setup
1. Run migration: `003_enterprise_health_cell_schema.sql`
2. Verify projects and services are initialized
3. Configure alert rules
4. Configure recovery actions

### Application Deployment
1. Install dependencies: `npm install`
2. Configure environment variables
3. Run installation: `npm run health:install`
4. Start health checks: `npm run health:check`
5. Start recovery: `npm run health:recovery`
6. Start dashboard: `npm run dev`

### GitHub Actions Setup
1. Add secrets to repository:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - N8N_WEBHOOK_URL
2. Enable workflows in `.github/workflows/`
3. Verify first run completes successfully

## Monitoring & Maintenance

### Daily Tasks (Automated)
- Aggregate daily metrics
- Clean up old logs (30 day retention)
- Send daily health summary

### Weekly Tasks
- Review alert thresholds
- Analyze incident patterns
- Optimize recovery actions

### Monthly Tasks
- Review uptime SLAs
- Audit alert effectiveness
- Update documentation

## Support & Troubleshooting

See README.md for:
- Common issues and solutions
- Troubleshooting guide
- Support contact information

## Version History

- **1.0.0** (2025-11-06) - Initial release
  - Complete health monitoring system
  - Recovery automation
  - Enterprise dashboard
  - API endpoints
  - GitHub Actions integration

---

**Built for enterprise-grade reliability**
**NØID Labs © 2025**
