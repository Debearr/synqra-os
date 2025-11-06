# Enterprise Health Cell System

A comprehensive infrastructure monitoring and recovery system for Synqra OS, NØID Labs, and AuraFX. Monitors Supabase services with real-time alerting, automated recovery, and enterprise-grade dashboards.

## 🌟 Features

### Core Monitoring
- **Multi-Service Health Checks**: PostgreSQL, REST API, Auth, Storage, Realtime, N8N
- **Real-time Monitoring**: Checks every 5 minutes with configurable intervals
- **Response Time Tracking**: Monitor latency and performance degradation
- **Uptime Calculation**: Historical uptime tracking with hourly and daily aggregation
- **Retry Logic**: Exponential backoff with configurable retry attempts

### Alerting & Notifications
- **Rule-Based Alerts**: Configurable alert rules based on:
  - Consecutive failures
  - Response time thresholds
  - Error rate percentages
  - Custom conditions
- **Multi-Channel Notifications**: N8N webhooks, email (extensible)
- **Alert Severity Levels**: Info, Warning, Error, Critical
- **Alert Lifecycle**: Active → Acknowledged → Resolved
- **Cooldown Periods**: Prevent alert fatigue

### Incident Management
- **Automatic Incident Creation**: Creates incidents for critical failures
- **Incident Timeline**: Track investigation, identification, and resolution
- **Impact Assessment**: Document affected services and user impact
- **Post-Mortem Support**: Resolution summaries and root cause analysis
- **Incident Updates**: Real-time status updates with public/private visibility

### Recovery Automation
- **Auto-Restart**: Automated service recovery attempts
- **Manual Intervention Triggers**: Notify on-call engineers
- **Escalation Policies**: Automatic escalation for persistent issues
- **Notify-Only Mode**: Information without action
- **Recovery Logging**: Complete audit trail of all recovery attempts

### Enterprise Dashboard
- **Real-time Status**: Live service health visualization
- **Project Overview**: Synqra OS, NØID Labs, AuraFX at-a-glance
- **Performance Metrics**: Response time and uptime charts (24h, 7d, 30d)
- **Active Alerts Panel**: Real-time alert monitoring
- **Incidents Timeline**: Historical incident tracking
- **Service Details**: Drill-down into individual service metrics

### API Endpoints
- `GET /api/health/overview` - System-wide health overview
- `GET /api/health/status` - Service status with filtering
- `GET /api/health/metrics` - Time-series metrics data
- `GET /api/health/alerts` - Alert management
- `PATCH /api/health/alerts` - Update alert status
- `GET /api/health/incidents` - Incident listing
- `POST /api/health/incidents` - Create manual incidents

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account with service role key
- N8N webhook URL (optional, for notifications)

### Installation

1. **Install Dependencies**
```bash
cd scripts/health-checks
npm install
```

2. **Set Environment Variables**
```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/health
```

3. **Initialize Database**
```bash
# Run migrations in order
psql -f supabase/migrations/001_initial_synqra_schema.sql
psql -f supabase/migrations/002_synqra_complete_schema.sql
psql -f supabase/migrations/003_enterprise_health_cell_schema.sql
```

4. **Run Health Monitor**
```bash
# One-time check
node enterprise-health-monitor.mjs

# Continuous monitoring (recovery automation)
node recovery-automation.mjs
```

5. **Start Dashboard**
```bash
npm run dev
# Dashboard available at http://localhost:3003
```

## 📊 Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│              (Scheduled Health Checks)                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│          Enterprise Health Monitor                       │
│  • Multi-service health checks                          │
│  • Response time tracking                               │
│  • Failure detection                                    │
│  • Alert triggering                                     │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│  Supabase Database   │  │   N8N Webhook                │
│  • Health logs       │  │   • Email notifications      │
│  • Service status    │  │   • Slack/Discord alerts     │
│  • Alerts & Incidents│  │   • Custom automations       │
│  • Metrics rollup    │  │                              │
└──────────────────────┘  └──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│            Recovery Automation System                    │
│  • Monitors failed services                             │
│  • Executes recovery actions                            │
│  • Creates/updates incidents                            │
│  • Escalates critical issues                            │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              Enterprise Dashboard                        │
│  • Real-time status visualization                       │
│  • Performance metrics charts                           │
│  • Alert management UI                                  │
│  • Incident timeline                                    │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

#### Core Tables
- `health_projects` - Project configuration (Synqra OS, NØID Labs, AuraFX)
- `health_services` - Services to monitor per project
- `health_logs` - Detailed health check logs
- `health_service_status` - Current status rollup

#### Alerting Tables
- `health_alert_rules` - Configurable alert conditions
- `health_alerts` - Active and historical alerts
- `health_alert_notifications` - Notification delivery log

#### Incident Tables
- `health_incidents` - Major incidents
- `health_incident_updates` - Incident timeline

#### Recovery Tables
- `health_recovery_actions` - Recovery action configuration
- `health_recovery_log` - Recovery execution history

#### Metrics Tables
- `health_metrics_hourly` - Hourly aggregated metrics
- `health_metrics_daily` - Daily aggregated metrics

## 🔧 Configuration

### Service Configuration

Services are configured in the database:

```sql
INSERT INTO health_services (
  project_id,
  service_key,
  display_name,
  description,
  endpoint_url,
  check_interval_seconds,
  timeout_ms,
  retry_count,
  thresholds
) VALUES (
  'project-uuid',
  'rest_api',
  'REST API',
  'Supabase REST API endpoint',
  'https://your-project.supabase.co/rest/v1/',
  300,  -- Check every 5 minutes
  10000, -- 10 second timeout
  3,     -- 3 retry attempts
  '{
    "response_time_warning_ms": 2000,
    "response_time_critical_ms": 5000,
    "error_rate_warning": 0.05,
    "error_rate_critical": 0.1
  }'::jsonb
);
```

### Alert Rules

Configure alerting thresholds:

```sql
INSERT INTO health_alert_rules (
  service_id,
  rule_name,
  description,
  condition_type,
  condition_config,
  severity,
  notification_channels,
  cooldown_minutes
) VALUES (
  'service-uuid',
  'Critical Failure Alert',
  'Trigger on 3 consecutive failures',
  'consecutive_failures',
  '{"threshold": 3}'::jsonb,
  'critical',
  ARRAY['n8n', 'email'],
  30
);
```

### Recovery Actions

Configure automated recovery:

```sql
INSERT INTO health_recovery_actions (
  service_id,
  action_name,
  action_type,
  trigger_condition,
  action_config,
  max_retries,
  is_enabled
) VALUES (
  'service-uuid',
  'Auto-Restart on Failure',
  'auto_restart',
  'consecutive_failures >= 3',
  '{"wait_time_ms": 5000}'::jsonb,
  3,
  true
);
```

## 📈 Monitoring Projects

### Synqra OS
Luxury social media automation platform
- PostgreSQL Database
- REST API
- Authentication
- Storage
- Realtime

### NØID Labs
Innovation and research division
- PostgreSQL Database
- REST API

### AuraFX
Creative effects platform
- PostgreSQL Database
- REST API

### Shared Infrastructure
- N8N Automation Platform

## 🔔 Alert Severity Levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Service down, immediate action required | < 15 minutes |
| **Error** | Service degraded, action needed soon | < 1 hour |
| **Warning** | Potential issues detected | < 4 hours |
| **Info** | Informational, no action needed | N/A |

## 🛠️ Maintenance

### Hourly Tasks (Automated)
- Aggregate health check metrics
- Calculate uptime percentages
- Update service status rollups

### Daily Tasks (Automated)
- Aggregate daily metrics
- Clean up old logs (30 day retention)
- Generate daily health reports

### Manual Tasks
- Review and acknowledge alerts
- Investigate incidents
- Update recovery action configs
- Adjust alert thresholds

## 📝 API Examples

### Get Overall Health Status
```bash
curl https://your-domain.com/api/health/overview
```

Response:
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_services": 12,
      "healthy_services": 11,
      "degraded_services": 1,
      "critical_services": 0,
      "overall_health_percentage": 91.67,
      "avg_uptime": 99.85,
      "avg_response_time_ms": 245,
      "active_alerts": 2,
      "active_incidents": 0
    },
    "projects": {...},
    "services": [...]
  }
}
```

### Get Service Metrics
```bash
curl "https://your-domain.com/api/health/metrics?service_id=uuid&period=24h&granularity=hourly"
```

### Acknowledge Alert
```bash
curl -X PATCH https://your-domain.com/api/health/alerts \
  -H "Content-Type: application/json" \
  -d '{"alert_id": "uuid", "status": "acknowledged"}'
```

## 🚨 Troubleshooting

### Health Checks Failing
1. Verify environment variables are set correctly
2. Check Supabase service role key has proper permissions
3. Review logs in `.healthcell/local-logs.jsonl`
4. Ensure network connectivity to Supabase

### Dashboard Not Loading
1. Check Next.js is running: `npm run dev`
2. Verify Supabase client configuration
3. Check browser console for errors
4. Ensure RLS policies allow access

### Alerts Not Triggering
1. Verify alert rules are active in database
2. Check N8N webhook URL is configured
3. Review alert cooldown periods
4. Check service status meets trigger conditions

### Recovery Actions Not Running
1. Ensure recovery actions are enabled
2. Check GitHub Actions workflow is scheduled
3. Verify service meets recovery trigger conditions
4. Review recovery logs

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [N8N Documentation](https://docs.n8n.io/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Support

For issues or questions:
- Email: debear@noidlux.com
- Check GitHub Issues
- Review system logs

## 📄 License

Proprietary - NØID Labs © 2025

---

**Built with ❤️ for enterprise-grade reliability**
