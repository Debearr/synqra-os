# 🚀 Enterprise Health Cell - Quick Setup

## ⚡ 60-Second Setup

### 1️⃣ Add GitHub Secrets

Visit: https://github.com/Debearr/synqra-os/settings/secrets/actions

Add these 4 secrets (click "New repository secret"):

```
SUPABASE_URL
→ https://tjfeindwmpuyayjvftke.supabase.co

SUPABASE_ANON_KEY
→ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0

SUPABASE_SERVICE_KEY
→ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI

N8N_WEBHOOK_URL
→ https://n8n.production.synqra.com/webhook/health-alerts
```

### 2️⃣ Run Migration

```bash
# Connect to Supabase and run:
psql -f scripts/health-checks/supabase/migrations/003_enterprise_health_cell_schema.sql
```

Or via Supabase Dashboard:
- Go to SQL Editor
- Paste contents of `003_enterprise_health_cell_schema.sql`
- Click "Run"

### 3️⃣ Test Workflow

Go to: https://github.com/Debearr/synqra-os/actions/workflows/enterprise-health-cell.yml

Click **"Run workflow"** → Select branch → **"Run workflow"**

---

## ✅ Verification

After setup, check:

1. **GitHub Secrets** (should show 4 secrets)
   https://github.com/Debearr/synqra-os/settings/secrets/actions

2. **Workflow Runs** (should show successful runs)
   https://github.com/Debearr/synqra-os/actions

3. **Database Tables** (should have 13 health_* tables)
   Check Supabase Table Editor

---

## 🎯 What's Running

| Service | Interval | Status |
|---------|----------|--------|
| Health Checks | Every 5 min | Auto |
| Recovery | Every 15 min | Auto |
| Metrics Hourly | Every hour | Auto |
| Metrics Daily | Daily midnight | Auto |

---

## 📚 Full Documentation

- **Setup Guide:** [GITHUB-SECRETS-SETUP.md](GITHUB-SECRETS-SETUP.md)
- **System Docs:** [scripts/health-checks/README.md](scripts/health-checks/README.md)
- **Technical Spec:** [ENTERPRISE-HEALTH-CELL-SPEC.md](ENTERPRISE-HEALTH-CELL-SPEC.md)

---

## 🆘 Issues?

Common fixes:

**"Missing environment variables"**
→ Add all 4 GitHub secrets

**"Table does not exist"**
→ Run database migration

**"Permission denied"**
→ Verify SUPABASE_SERVICE_KEY is correct

**Need help?** → debear@noidlux.com

---

✅ **Ready for production after adding GitHub secrets!**
