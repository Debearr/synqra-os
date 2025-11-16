# 🚂 RAILWAY AUTOMATION — QUICK SETUP

**Time**: 25 minutes  
**Result**: Fully automated, self-healing Railway pipeline

---

## ✅ WHAT YOU HAVE NOW

- ✅ Webhook handler → auto-processes Railway events
- ✅ Health Cell → 8 comprehensive checks
- ✅ Auto-repair → restarts/scales on failures
- ✅ Service config → centralized ports/domains/resources
- ✅ Cron schedule → 6 scheduled tasks
- ✅ Env validation → type-safe, startup checks
- ✅ Complete docs → 4 detailed guides

---

## 🚀 RAILWAY UI SETUP (5 STEPS)

### 1. Enable Webhooks (5 min)

**Path**: Railway → [Service] → Settings → Webhooks

**URL**: `https://synqra.app/api/railway-webhook`

**Events to enable**:
- Deployment Crashed
- Deployment OOM Killed
- Deployment Failed
- Monitor Triggered
- CPU/Memory Threshold Alerts

**Do for**: synqra-mvp, noid-dashboard, noid-digital-cards

---

### 2. Set Webhook Secret (1 min)

**Path**: Railway → Project → Settings → Shared Variables

**Variable**: `RAILWAY_WEBHOOK_SECRET`

**Value**: Generate with:
```bash
openssl rand -hex 32
```

---

### 3. Configure Ports (3 min)

**Path**: Railway → [Service] → Settings → Networking

- synqra-mvp: `3000`
- noid-dashboard: `3001`
- noid-digital-cards: `3002`

---

### 4. Set Up Cron Jobs (12 min)

**Path**: Railway → synqra-mvp → Settings → Cron

Add 6 jobs (copy from `/workspace/config/cron-schedule.ts`):

1. **Enterprise Health Check** → `*/15 * * * *` → `curl https://synqra.app/api/health/enterprise`
2. **Waitlist Email Queue** → `*/5 * * * *` → `curl -X POST https://synqra.app/api/waitlist/process-queue`
3. **Market Intelligence** → `0 */6 * * *` → `curl -X POST https://synqra.app/api/intelligence/aggregate`
4. **Cache Cleanup** → `0 3 * * *` → `curl -X POST https://synqra.app/api/cache/cleanup`
5. **Analytics Rollup** → `0 1 * * *` → `curl -X POST https://synqra.app/api/analytics/rollup`
6. **Auto Optimizer** → `0 */12 * * *` → `curl -X POST https://synqra.app/api/optimize`

---

### 5. Set Health Checks (2 min)

**Path**: Railway → [Service] → Settings → Health Check

- All services: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Restart Threshold: 3 failures

---

## 🧪 TEST EVERYTHING (5 min)

### 1. Test Webhook

```bash
curl https://synqra.app/api/railway-webhook
```

**Expected**: `{ "service": "railway-webhook", "status": "healthy" }`

---

### 2. Test Health Check

```bash
curl https://synqra.app/api/health/enterprise
```

**Expected**: `{ "overall": "healthy", "summary": { "passed": 8 } }`

---

### 3. Trigger Test Event

In Railway UI, trigger a deployment. Watch webhook logs for event processing.

---

## 📚 FULL DOCUMENTATION

- **Complete Guide**: `/workspace/docs/railway-integration.md` (800+ lines)
- **Ports & Domains**: `/workspace/docs/railway-ports-and-domains.md`
- **Env Variables**: `/workspace/docs/env-variables-and-railway.md`
- **Cron Jobs**: `/workspace/docs/cron-jobs.md`
- **Full Report**: `/workspace/RAILWAY-AUTOMATION-COMPLETE.md`

---

## 🎯 HOW IT WORKS

```
Railway Event (crash/OOM/failure)
    ↓
Webhook → /api/railway-webhook
    ↓
Parse & Classify Event
    ↓
Trigger Health Check
    ↓
Enterprise Health Cell (8 checks)
    ↓
Auto-Repair (if needed)
    ↓
Log + Notify
```

---

## 🚨 TROUBLESHOOTING

### Webhook not receiving events?

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Ensure service is deployed

### Health check failing?

1. Run manually: `curl https://synqra.app/api/health/enterprise`
2. Check which checks failed in response
3. Review logs for error details

### Cron job not running?

1. Verify job is enabled in Railway UI
2. Test endpoint manually with curl
3. Check Railway logs for execution

---

**Done! Your Railway pipeline is now bulletproof. 🎉**

---

**Version**: 1.0  
**Date**: 2025-11-15  
**Owner**: NØID Labs
