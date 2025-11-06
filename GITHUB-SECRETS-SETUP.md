# GitHub Secrets Setup for Enterprise Health Cell

## ⚡ Quick Setup (Automated)

If you have GitHub CLI installed:

```bash
cd scripts/health-checks
./setup-github-secrets.sh
```

This will automatically configure all required secrets in your GitHub repository.

---

## 🔐 Manual Setup (If GitHub CLI is not available)

### Step 1: Navigate to Repository Secrets

Go to: https://github.com/Debearr/synqra-os/settings/secrets/actions

### Step 2: Add Required Secrets

Click **"New repository secret"** and add each of the following:

#### Secret 1: SUPABASE_URL

```
Name: SUPABASE_URL
Value: https://tjfeindwmpuyayjvftke.supabase.co
```

#### Secret 2: SUPABASE_ANON_KEY

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0
```

#### Secret 3: SUPABASE_SERVICE_KEY

```
Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI
```

#### Secret 4: N8N_WEBHOOK_URL

```
Name: N8N_WEBHOOK_URL
Value: https://n8n.production.synqra.com/webhook/health-alerts
```

### Step 3: Verify Secrets

After adding all secrets, you should see 4 secrets listed:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_KEY
- ✅ N8N_WEBHOOK_URL

---

## 🚀 Testing the Setup

### Option 1: Trigger Workflow Manually

1. Go to: https://github.com/Debearr/synqra-os/actions/workflows/enterprise-health-cell.yml
2. Click **"Run workflow"**
3. Select branch: `claude/enterprise-health-cell-system-011CUrqQy1LUiLGCMtkDxqm7`
4. Click **"Run workflow"**

### Option 2: Run Locally

```bash
cd scripts/health-checks

# Install dependencies
npm install

# Test health check
npm run health:check

# Test dashboard
npm run dev
```

### Option 3: Using GitHub CLI

```bash
# Trigger workflow
gh workflow run enterprise-health-cell.yml \
  --repo Debearr/synqra-os \
  --ref claude/enterprise-health-cell-system-011CUrqQy1LUiLGCMtkDxqm7

# View workflow runs
gh run list --repo Debearr/synqra-os --workflow=enterprise-health-cell.yml

# Watch live logs
gh run watch --repo Debearr/synqra-os
```

---

## ✅ Success Indicators

After setup, you should see:

### GitHub Actions
- ✅ Health check workflow runs every 5 minutes
- ✅ No secret-related errors in logs
- ✅ Successful Supabase connection messages

### Local Development
- ✅ `.env` file contains all required keys
- ✅ `npm run health:check` completes successfully
- ✅ Dashboard loads at `http://localhost:3003`

---

## 🔧 Troubleshooting

### Workflow Fails with "Missing environment variables"

**Solution:** Verify all 4 secrets are configured in GitHub repository settings.

### "Invalid JWT token" Error

**Solution:** Double-check that you copied the complete JWT tokens without any extra spaces or newlines.

### "Connection timeout" Error

**Solution:**
1. Verify `SUPABASE_URL` is correct
2. Check Supabase project is active
3. Verify service role key has proper permissions

### N8N Webhook Not Receiving Alerts

**Solution:**
1. Verify `N8N_WEBHOOK_URL` is correct and accessible
2. Check N8N workflow is active
3. Note: N8N webhook is optional - system works without it

---

## 📋 Secret Values Reference

All secret values are also stored in:
- `/scripts/health-checks/.env` (local development)
- `/.env` (root, for main app)
- `/scripts/health-checks/.env.example` (template)

**⚠️ SECURITY NOTE:** Never commit `.env` files with real values to git!

---

## 🔄 Workflow Schedule

Once secrets are configured, the following will run automatically:

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| Health Check | Every 5 minutes | Monitor all services |
| Recovery Automation | Every 15 minutes | Auto-recovery actions |
| Hourly Metrics | Every hour | Aggregate metrics |
| Daily Cleanup | Daily at midnight | Clean old logs |

---

## 📚 Additional Resources

- **Full Documentation:** [scripts/health-checks/README.md](scripts/health-checks/README.md)
- **Technical Spec:** [ENTERPRISE-HEALTH-CELL-SPEC.md](ENTERPRISE-HEALTH-CELL-SPEC.md)
- **Dashboard:** Run `npm run dev` in `scripts/health-checks/`

---

## 🆘 Need Help?

If you encounter issues:

1. Check workflow logs: https://github.com/Debearr/synqra-os/actions
2. Review setup logs in `.healthcell/install.log`
3. Contact: debear@noidlux.com

---

**Last Updated:** 2025-11-06
**Status:** ✅ Ready for Production
