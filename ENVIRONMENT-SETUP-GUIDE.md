# 🔐 NØID LABS - ENVIRONMENT CONFIGURATION GUIDE
**Last Updated:** 2025-11-15  
**Purpose:** Complete guide to setting up environment variables across all apps

---

## 📋 QUICK START

### Local Development
```bash
# 1. Copy the template
cp .env.example .env.local

# 2. Fill in your actual keys (see sections below)
nano .env.local

# 3. Verify configuration
node bootstrap-migration.mjs
```

### Production Deployment (Railway)
```bash
# Option 1: Railway CLI
railway variables set SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
railway variables set SUPABASE_ANON_KEY=your_key_here
# ... (set all required variables)

# Option 2: Railway Dashboard
# Go to: https://railway.app/project/your-project/variables
# Click "RAW Editor" and paste all variables
```

---

## 🔑 REQUIRED KEYS (Must Configure)

### 1. Supabase Database
**Priority:** 🔴 **CRITICAL**  
**Apps:** All (Synqra, NØID, Health Checks)

```bash
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Public keys (for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke)
2. Navigate to **Settings → API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public** key → `SUPABASE_ANON_KEY` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

---

### 2. Anthropic Claude API
**Priority:** 🔴 **CRITICAL** (for Synqra agents)  
**Apps:** Synqra MVP

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
AGENT_MODE=live
AGENT_MAX_TOKENS=1024
```

**Where to get:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **API Keys**
3. Create a new key
4. Copy the key starting with `sk-ant-api03-`

**Cost Info:**
- Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens
- With optimization: ~$0.01-$0.02 per agent reply
- 10,000 replies/month ≈ $100-200

---

### 3. Telegram Bot
**Priority:** 🟠 **HIGH** (for monitoring alerts)  
**Apps:** Health monitoring system

```bash
TELEGRAM_BOT_TOKEN=8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg
TELEGRAM_CHANNEL_ID=@AuraFX_Hub
```

**Already configured - no action needed**

To change:
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot
3. Copy the token

---

## 🔧 OPTIONAL KEYS

### 4. Email (SMTP)
**Priority:** 🟡 **MEDIUM**  
**Apps:** Synqra (waitlist emails)

```bash
SMTP_HOST=smtp.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@noidlux.com
SMTP_PASS=your_password_here
FROM_EMAIL=noreply@noidlux.com
```

**Required for:**
- Waitlist confirmation emails
- Password reset emails
- System notifications

---

### 5. Stripe (Billing)
**Priority:** 🟡 **MEDIUM**  
**Apps:** NØID Dashboard

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Where to get:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy **Publishable key** and **Secret key**
3. For webhooks: Dashboard → Developers → Webhooks

---

### 6. Social Media OAuth
**Priority:** 🟢 **LOW** (future feature)  
**Apps:** Synqra posting pipeline

```bash
YOUTUBE_CLIENT_ID=...
LINKEDIN_CLIENT_ID=...
INSTAGRAM_CLIENT_ID=...
TIKTOK_CLIENT_ID=...
X_API_KEY=...
```

**Not required yet** - posting pipeline is stubbed out.

---

## 🚀 DEPLOYMENT-SPECIFIC CONFIGS

### Railway

**Set these variables in Railway dashboard:**

```bash
# Core
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
AGENT_MODE=live

# Telegram
TELEGRAM_BOT_TOKEN=8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg
TELEGRAM_CHANNEL_ID=@AuraFX_Hub

# Port
PORT=3004

# Environment
NODE_ENV=production
```

**How to set:**
1. Go to Railway project
2. Click on service (e.g., `synqra-mvp`)
3. Go to **Variables** tab
4. Click **RAW Editor**
5. Paste all variables
6. Click **Save**

---

### Vercel

Similar to Railway, but use Vercel dashboard:
1. Go to project settings
2. Navigate to **Environment Variables**
3. Add variables for **Production**, **Preview**, and **Development**

---

## ✅ VERIFICATION

### Test Supabase Connection
```bash
node bootstrap-migration.mjs
```

Expected output:
```
✅ Supabase connection successful (664ms)
✅ Database tables verified
```

### Test Agent System
```bash
cd apps/synqra-mvp
npm run dev
```

Then test: `curl http://localhost:3004/api/health`

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "agents": { "status": "healthy", "mode": "live" }
  }
}
```

---

## 🔒 SECURITY BEST PRACTICES

1. **Never commit .env files**
   - Already in `.gitignore`
   - Double-check with: `git status`

2. **Rotate keys regularly**
   - Supabase: Every 90 days
   - Anthropic: Every 90 days
   - Stripe: After any security incident

3. **Use separate keys for dev/prod**
   - Dev: Use test/sandbox keys
   - Prod: Use production keys

4. **Limit key permissions**
   - Supabase: Use anon key for client-side
   - Supabase: Only use service role server-side
   - Stripe: Use restricted keys when possible

5. **Monitor usage**
   - Check Anthropic usage: https://console.anthropic.com/
   - Check Supabase usage: Dashboard → Usage
   - Set up billing alerts

---

## 🆘 TROUBLESHOOTING

### "Supabase client not initialized"
**Fix:** Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set

### "ANTHROPIC_API_KEY is required in live mode"
**Fix:** Set `ANTHROPIC_API_KEY` or change `AGENT_MODE=mock`

### "Agent responses are too expensive"
**Check:**
- Is `AGENT_MAX_TOKENS=1024`? (not 4096)
- Is agent mode `live`? (not `mock`)
- Check token usage in API responses

### "Health checks failing"
**Check:**
1. GitHub Secrets are set (see [GitHub Actions](#github-actions))
2. `TELEGRAM_BOT_TOKEN` is correct
3. `SUPABASE_URL` is accessible

---

## 🤖 GITHUB ACTIONS

For CI/CD and health monitoring, set these secrets:

**Go to:** Repository → Settings → Secrets and variables → Actions

**Required secrets:**
```
SUPABASE_URL
SUPABASE_SERVICE_KEY
SUPABASE_ANON_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
N8N_WEBHOOK_URL (optional)
```

**How to add:**
1. Click "New repository secret"
2. Name: `SUPABASE_URL`
3. Secret: `https://tjfeindwmpuyajvjftke.supabase.co`
4. Click "Add secret"
5. Repeat for all secrets

---

## 📊 COST TRACKING

### Current Optimization (Block 2 complete)
- **Before:** 4096 max tokens, $0.04-$0.08 per reply
- **After:** 1024 max tokens, $0.01-$0.02 per reply
- **Savings:** 60-75% cost reduction

### Monthly Projections (10,000 requests)
- **Quick tier (300 tokens):** 30% of queries ≈ $24/month
- **Standard tier (600 tokens):** 50% of queries ≈ $75/month
- **Detailed tier (1024 tokens):** 20% of queries ≈ $50/month
- **Total:** ~$150/month (well under $200 target)

---

## 📝 CHECKLIST

Before deploying:
- [ ] All required variables set in Railway/Vercel
- [ ] Supabase connection tested
- [ ] Agent system tested (if using Synqra)
- [ ] GitHub secrets configured
- [ ] Email configuration tested (if using waitlist)
- [ ] Stripe configured (if using billing)
- [ ] Cost tracking enabled
- [ ] Health monitoring operational

---

**Questions?** Check:
- `ALL_SYSTEMS_READY_REPORT.md`
- `BLOCK-1-ECOSYSTEM-AUDIT-REPORT.md`
- Supabase docs: https://supabase.com/docs
- Anthropic docs: https://docs.anthropic.com/

**Last updated:** 2025-11-15 by Lead Autonomous Engineer
