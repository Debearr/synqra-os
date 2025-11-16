# ⚡ Enterprise Health Cell - Quick Start

## 🎯 3-Step Deployment

### Step 1: Apply Database Migration (5 minutes)

1. Open: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor
2. Click: **SQL Editor** → **New query**
3. Copy/paste: `supabase/migrations/003_enterprise_health_cell_schema.sql`
4. Click: **Run**
5. Verify: Navigate to **Table Editor** → Confirm 11 tables exist

### Step 2: Configure GitHub Secrets (3 minutes)

**Option A: Automated (recommended)**
```bash
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

**Option B: Manual**

Go to: https://github.com/Debearr/synqra-os/settings/secrets/actions

Add these secrets:
- `SUPABASE_URL` - From `.env`
- `SUPABASE_SERVICE_KEY` - From `.env`
- `SUPABASE_ANON_KEY` - From `.env`
- `N8N_WEBHOOK_URL` - From `.env`
- `TELEGRAM_BOT_TOKEN` - From `.env`
- `TELEGRAM_CHANNEL_ID` - From `.env`

### Step 3: Test Workflows (2 minutes)

1. Go to: https://github.com/Debearr/synqra-os/actions
2. Select: **Enterprise Health Cell System**
3. Click: **Run workflow** → **Run workflow**
4. Wait: ~2 minutes for completion
5. Verify: All jobs show green ✅

---

## ✅ Success Checklist

After deployment, verify:

- [ ] All 11 tables visible in Supabase Table Editor
- [ ] GitHub workflow shows green checkmarks
- [ ] New metrics appearing in `metrics` table
- [ ] Telegram notifications working
- [ ] N8N webhook receiving alerts

---

## 📊 What You Get

Once deployed, the system automatically:

- ✅ Monitors service health every 5 minutes
- ✅ Records metrics to database
- ✅ Creates incidents on failures
- ✅ Sends alerts via N8N and Telegram
- ✅ Attempts auto-recovery every 15 minutes
- ✅ Aggregates daily metrics
- ✅ Cleans up old data

---

## 🚨 If Something Goes Wrong

**Migration fails:**
- Check you're using service role key (not anon key)
- Ignore "already exists" errors - they're safe

**Workflow fails:**
- Verify all secrets are set correctly
- Check secret names match exactly (case-sensitive)
- Ensure migration was applied first

**No data appearing:**
- Migration might not be applied
- Check workflow logs for errors
- Verify Supabase URL and keys are correct

---

## 📚 Detailed Guides

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Migration details: `MIGRATION_SUMMARY.md`
- Migration instructions: `ENTERPRISE_HEALTH_MIGRATION_GUIDE.md`

---

## 🔗 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke
- **GitHub Actions:** https://github.com/Debearr/synqra-os/actions
- **GitHub Secrets:** https://github.com/Debearr/synqra-os/settings/secrets/actions

---

**Total Setup Time:** ~10 minutes
**Status:** Ready to deploy
**Last Updated:** 2025-11-11
