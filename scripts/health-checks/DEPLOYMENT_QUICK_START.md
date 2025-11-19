# 🚀 Synqra Railway Deployment - Quick Start

**Status:** ✅ READY TO DEPLOY  
**Target:** synqra.co  
**Time to Live:** ~5-10 minutes

---

## 1️⃣ Set Environment Variables (2 minutes)

In Railway Dashboard → Settings → Variables, add:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...

# Optional but recommended
RAILWAY_WEBHOOK_SECRET=$(openssl rand -hex 32)
DRY_RUN=true
POSTING_ENABLED=false
```

---

## 2️⃣ Configure Domain (1 minute)

1. Railway Dashboard → Settings → Domains
2. Add custom domain: **synqra.co**
3. Update DNS: CNAME → Railway URL

---

## 3️⃣ Enable Health Checks (1 minute)

Railway Dashboard → Settings → Health Check:
- **Path:** `/api/health`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Failures:** 3

---

## 4️⃣ Deploy (2 minutes)

```bash
# Option A: Push to main
git push origin main

# Option B: Railway CLI
railway up

# Option C: Manual in dashboard
Click "Deploy" → "Redeploy"
```

---

## 5️⃣ Verify (1 minute)

```bash
# Test health
curl https://synqra.co/api/health

# Run full verification
bash scripts/verify-deployment.sh https://synqra.co
```

---

## ✅ You're Done!

**Full Report:** See `/RAILWAY_PREFLIGHT_CHECK_REPORT.md`

**Need Help?**
- Check Railway logs: `railway logs --follow`
- Health status: https://synqra.co/api/health/enterprise
- Troubleshooting: See full report Section 🔍
