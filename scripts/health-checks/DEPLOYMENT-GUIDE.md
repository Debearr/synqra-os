# Enterprise Health Cell System — Deployment Guide

**Created:** 2025-11-11
**Version:** 1.0.0
**Status:** Production Ready

---

## 🎯 Deployment Overview

This guide walks you through deploying the Enterprise Health Cell System to your Supabase project. The deployment consists of **3 critical steps** that must be executed in order.

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] Supabase project created and accessible
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in your `.env` file
- [ ] Node.js 20+ installed
- [ ] Dependencies installed: `npm install`

---

## 📋 Step-by-Step Deployment

### **STEP 1: Deploy Database Schema** ⚠️ CRITICAL

The health monitoring system requires 13 database tables. Deploy them using the Supabase SQL Editor:

#### Option A: Automated Validation (Recommended)

```bash
cd scripts/health-checks
node deploy-schema.mjs
```

This script will:
- ✅ Check for existing tables
- ✅ Validate environment variables
- ✅ Provide manual deployment instructions
- ✅ Verify deployment success

#### Option B: Manual Deployment

1. **Open Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new`

2. **Copy SQL Migration**
   - File: `scripts/health-checks/supabase/migrations/003_enterprise_health_cell_schema.sql`
   - Copy entire contents (500+ lines)

3. **Execute in SQL Editor**
   - Paste the SQL into the Supabase SQL Editor
   - Click **"Run"**
   - Wait for completion (~10 seconds)

4. **Verify Deployment**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'health_%'
   ORDER BY table_name;
   ```

   **Expected Result:** 13 tables
   - `health_alert_notifications`
   - `health_alert_rules`
   - `health_alerts`
   - `health_incident_updates`
   - `health_incidents`
   - `health_logs`
   - `health_metrics_daily`
   - `health_metrics_hourly`
   - `health_projects`
   - `health_recovery_actions`
   - `health_recovery_log`
   - `health_service_status`
   - `health_services`

---

### **STEP 2: Seed Initial Data**

After schema deployment, initialize projects, services, and alert rules:

```bash
cd scripts/health-checks
node seed-health-data.mjs
```

This will create:
- ✅ 4 Projects (SYNQRA OS, NØID Labs, AuraFX, Shared Infrastructure)
- ✅ 16 Services (4 services per project: PostgreSQL, REST API, Auth, Storage)
- ✅ 32 Alert Rules (2 rules per service)
- ✅ 48 Recovery Actions (3 actions per service)

**Expected Output:**
```
✅ SUCCESS: Seed data initialized!

📊 Summary:
   - Projects: 4
   - Services: 16

🎯 Next Steps:
   1. Test health monitor: node enterprise-health-monitor.mjs
   2. Check dashboard: http://localhost:3003
```

---

### **STEP 3: Validate Health Monitor**

Test that the health monitoring system works:

```bash
cd scripts/health-checks
node enterprise-health-monitor.mjs
```

**Expected Output:**
```
🚀 Enterprise Health Cell System - Starting health checks...
📅 2025-11-11T...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Monitoring 16 services across all projects

🔍 Checking SYNQRA_OS PostgreSQL (postgres)...
✅ SYNQRA_OS PostgreSQL: PostgreSQL connection successful (234ms)

🔍 Checking SYNQRA_OS REST API (rest_api)...
✅ SYNQRA_OS REST API: REST API check successful (456ms)

... (continues for all services)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successful checks: 16/16
❌ Failed checks: 0/16
⏱️  Total time: 3421ms
✅ All services healthy
```

---

## 🚨 Troubleshooting

### Problem: `deploy-schema.mjs` says tables are missing

**Solution:**
1. Manually run the SQL migration in Supabase SQL Editor
2. Run `deploy-schema.mjs` again to validate
3. Check Supabase logs for errors

### Problem: `seed-health-data.mjs` fails with "table does not exist"

**Solution:**
1. Verify schema deployment: `node deploy-schema.mjs`
2. Ensure all 13 tables exist in Supabase
3. Check environment variables are correct

### Problem: `enterprise-health-monitor.mjs` exits with error code 1

**Solution:**
1. Check Supabase connectivity: `node ping-supabase.mjs`
2. Verify services exist: Run SQL query `SELECT * FROM health_services LIMIT 5;`
3. Check logs in `scripts/health-checks/.healthcell/local-logs.jsonl`

### Problem: Permission denied errors

**Solution:**
1. Verify `SUPABASE_SERVICE_KEY` is the **service_role** key (not anon key)
2. Check RLS policies are not blocking service role access
3. Verify API settings in Supabase dashboard

---

## 🔐 Security Considerations

### Environment Variables

**NEVER commit these to git:**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service role key (full access)
N8N_WEBHOOK_URL=https://xxx/webhook  # Optional
```

### RLS Policies

The health monitoring tables are designed to bypass RLS when using the service role key. This is intentional for monitoring purposes.

### N8N Webhook

The `N8N_WEBHOOK_URL` is optional. If not set:
- Health checks still run
- Alerts are logged to database
- No external notifications sent

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] All 13 health tables exist in Supabase
- [ ] 4 projects inserted in `health_projects`
- [ ] 16 services inserted in `health_services`
- [ ] Alert rules and recovery actions created
- [ ] `enterprise-health-monitor.mjs` runs successfully
- [ ] Health logs appear in `health_logs` table
- [ ] No permission errors in Supabase logs

---

## 🎯 Next Steps

After successful deployment:

1. **Configure GitHub Actions**
   - Ensure secrets are set: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `N8N_WEBHOOK_URL`
   - Workflow: `.github/workflows/enterprise-health-cell.yml`
   - Test with manual trigger

2. **Configure Railway**
   - Health check endpoint: `/api/health`
   - Configured in: `railway.json`

3. **Monitor Health Dashboard**
   - Run locally: `npm run dev` (port 3003)
   - Access: `http://localhost:3003`

---

## 🆘 Support

If you encounter issues:

1. Check logs: `scripts/health-checks/.healthcell/local-logs.jsonl`
2. Review Supabase logs in dashboard
3. Run validation: `node deploy-schema.mjs`
4. Check GitHub Issues for known problems

---

**Deployment Complete** ✅

The Enterprise Health Cell System is now ready to monitor your infrastructure 24/7.
