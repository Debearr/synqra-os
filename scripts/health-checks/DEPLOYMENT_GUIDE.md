# 🚀 Enterprise Health Cell - Deployment Guide

## ✅ Current Status

**Environment Variables:** ✅ Configured in `.env` and `.env.local`
**Migration File:** ✅ Created (`supabase/migrations/003_enterprise_health_cell_schema.sql`)
**Workflows:** ✅ Configured (`.github/workflows/enterprise-health-cell.yml`)
**Health Scripts:** ✅ Ready (`scripts/health-checks/`)

---

## 📋 Required Steps (In Order)

### **Step 1: Apply Database Migration** ⚠️ REQUIRED

The migration file is ready but needs to be applied to your Supabase database.

**Method 1: Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor
   ```

2. Click **"SQL Editor"** in the left sidebar

3. Click **"New query"**

4. Copy the entire contents of:
   ```
   supabase/migrations/003_enterprise_health_cell_schema.sql
   ```

5. Paste into the SQL Editor

6. Click **"Run"** (or press Cmd/Ctrl + Enter)

7. Verify success - you should see "Success. No rows returned"

8. Navigate to **"Table Editor"** and confirm all 11 tables are present:
   - services
   - health_checks
   - metrics
   - incidents
   - incident_updates
   - maintenance_windows
   - alert_rules
   - alert_history
   - sla_targets
   - status_page_subscriptions
   - audit_logs

**Method 2: Supabase CLI (Alternative)**

If you have Supabase CLI installed locally:

```bash
# Link to your project
supabase link --project-ref tjfeindwmpuyajvjftke

# Apply the migration
supabase db push
```

---

### **Step 2: Configure GitHub Secrets** ⚠️ REQUIRED

Your workflows need these secrets to run. Set them up in GitHub:

1. Go to your GitHub repository:
   ```
   https://github.com/Debearr/synqra-os/settings/secrets/actions
   ```

2. Click **"New repository secret"** and add each of these:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `SUPABASE_URL` | `https://tjfeindwmpuyajvjftke.supabase.co` | From `.env` |
| `SUPABASE_SERVICE_KEY` | Your service role JWT | From `.env` (SUPABASE_SERVICE_KEY) |
| `SUPABASE_ANON_KEY` | Your anon key JWT | From `.env` |
| `N8N_WEBHOOK_URL` | `https://n8n.production.synqra.com/webhook/health-alerts` | From `.env` |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | From `.env` |
| `TELEGRAM_CHANNEL_ID` | `@AuraFX_Hub` | From `.env` |

**Quick Copy Commands** (run these locally to see values):

```bash
# Show current .env values (DO NOT share publicly)
cat .env | grep -E 'SUPABASE_URL|SUPABASE_SERVICE_KEY|SUPABASE_ANON_KEY|N8N_WEBHOOK_URL|TELEGRAM_BOT_TOKEN|TELEGRAM_CHANNEL_ID'
```

---

### **Step 3: Configure Railway Secrets** (Optional)

If deploying to Railway:

1. Go to your Railway project dashboard

2. Navigate to **Variables** tab

3. Add the same environment variables as above

---

### **Step 4: Test Workflows**

Once secrets are configured:

1. Go to GitHub Actions:
   ```
   https://github.com/Debearr/synqra-os/actions
   ```

2. Find the **"Enterprise Health Cell System"** workflow

3. Click **"Run workflow"** → **"Run workflow"** (manually trigger)

4. Monitor the run - all 4 jobs should turn green:
   - ✅ Run Enterprise Health Checks
   - ✅ Aggregate Daily Metrics
   - ✅ Recovery Automation
   - ✅ Update Status Page

---

## 🔧 Automated Setup Script

We've created a helper script to automate GitHub secrets setup:

```bash
# From your local machine (not Cursor environment)
cd scripts/health-checks
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

This script uses `gh` CLI to set secrets automatically.

**Prerequisites:**
```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Linux

# Authenticate
gh auth login
```

---

## 📊 Verification Checklist

After deployment, verify:

### Database (Supabase Dashboard)

- [ ] 11 tables exist in Table Editor
- [ ] 3 views created (active_incidents, service_health_summary, recent_metrics_summary)
- [ ] 3 functions created (Database → Functions)
- [ ] No errors in Logs

### GitHub Actions

- [ ] All secrets configured
- [ ] Workflow runs successfully
- [ ] No errors in workflow logs
- [ ] Artifacts uploaded on failure

### Health Monitoring

- [ ] Health checks running every 5 minutes
- [ ] Metrics being recorded in `metrics` table
- [ ] Incidents auto-created on failures
- [ ] N8N webhook receiving alerts
- [ ] Telegram notifications working

---

## 🔄 Workflow Schedule

Once deployed, your workflows will run automatically:

| Workflow Job | Frequency | Purpose |
|-------------|-----------|---------|
| Health Checks | Every 5 minutes | Monitor service health, record metrics |
| Recovery Automation | Every 15 minutes | Auto-remediation attempts |
| Daily Metrics Aggregation | Once daily (midnight UTC) | Aggregate and cleanup old data |
| Status Page Update | After health checks | Update public status page |

---

## 🚨 Troubleshooting

### Migration Fails

**Error:** "relation already exists"
- **Solution:** This is safe - table already created. Continue.

**Error:** "permission denied"
- **Solution:** Ensure you're using the service role key, not anon key

### Workflow Fails

**Error:** "secrets.SUPABASE_URL not found"
- **Solution:** Add the secret in GitHub repo settings

**Error:** "Cannot find module '@supabase/supabase-js'"
- **Solution:** Package.json should include it. Check `scripts/health-checks/package.json`

### Health Checks Fail

**Error:** "table does not exist"
- **Solution:** Migration not applied. Complete Step 1.

**Error:** "connection refused"
- **Solution:** Check SUPABASE_URL is correct

---

## 📞 Support Resources

- **Migration Summary:** `MIGRATION_SUMMARY.md`
- **Migration Guide:** `ENTERPRISE_HEALTH_MIGRATION_GUIDE.md`
- **Health Checks README:** `scripts/health-checks/README.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke
- **GitHub Actions:** https://github.com/Debearr/synqra-os/actions

---

## ✅ Success Indicators

You'll know deployment is successful when:

1. ✅ All 11 tables visible in Supabase Table Editor
2. ✅ GitHub Actions workflow shows all green checkmarks
3. ✅ New rows appearing in `metrics` table every 5 minutes
4. ✅ `services` table populated with your services
5. ✅ Telegram channel receiving health notifications
6. ✅ N8N webhook receiving alerts

---

## 🎯 Next Steps After Deployment

1. **Add Your Services**
   ```sql
   INSERT INTO services (name, description, service_type, url)
   VALUES ('My API', 'Production API', 'api', 'https://api.example.com');
   ```

2. **Configure Health Checks**
   ```sql
   INSERT INTO health_checks (service_id, check_name, check_type, endpoint, interval_seconds)
   VALUES ('[service-uuid]', 'API Health', 'http', 'https://api.example.com/health', 300);
   ```

3. **Set Up Alert Rules**
   ```sql
   INSERT INTO alert_rules (service_id, rule_name, metric_name, condition_type, operator, threshold_value, severity)
   VALUES ('[service-uuid]', 'High Response Time', 'response_time', 'threshold', '>', 500, 'high');
   ```

4. **Define SLA Targets**
   ```sql
   INSERT INTO sla_targets (service_id, target_name, target_type, target_value, target_unit)
   VALUES ('[service-uuid]', '99.9% Uptime', 'uptime', 99.9, 'percent');
   ```

---

**Last Updated:** 2025-11-11
**Status:** Ready for Deployment
**Project:** Synqra OS Enterprise Health Cell
