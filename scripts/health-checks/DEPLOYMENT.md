# Synqra OS - Railway Deployment Guide

## 🚀 Quick Deploy (Choose One Method)

### Method 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/configure-railway.sh

# Run configuration script
./scripts/configure-railway.sh
```

### Method 2: Railway Dashboard (Manual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Select your `synqra-os` project

2. **Navigate to Environment Variables**
   - Click on `synqra-mvp` service
   - Go to "Variables" tab
   - Click "+ New Variable"

3. **Add These Variables:**

```bash
# Required for Live Mode
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
AGENT_MODE=live

# Agent Configuration
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.7

# RAG Configuration
RAG_ENABLED=true
RAG_MAX_DOCUMENTS=5
RAG_MIN_SIMILARITY=0.7

# Memory
CONVERSATION_HISTORY_LIMIT=20

# Safety
HALLUCINATION_CHECK=true
DUAL_PASS_VALIDATION=true
MIN_CONFIDENCE_THRESHOLD=0.6

# Production Settings
DEBUG_AGENTS=false
NODE_ENV=production

# Supabase (Optional)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```

4. **Click "Deploy"**
   - Railway will auto-redeploy with new environment variables

### Method 3: Railway CLI

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login with your token
railway login --browserless

# Link to your project
railway link

# Set variables one by one
railway variables set ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY_HERE"
railway variables set AGENT_MODE="live"
railway variables set ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Trigger redeploy
railway up
```

---

## 🧪 Testing Deployment

### 1. Health Check

```bash
# Check if service is healthy
curl https://synqra.co/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "services": {
    "agents": {
      "status": "healthy",
      "mode": "live",
      "errors": []
    },
    "rag": {
      "status": "healthy",
      "documentsCount": 10,
      "categoriesCount": 10
    }
  }
}
```

### 2. Test Agent (Auto-Routing)

```bash
curl -X POST https://synqra.co/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much does Synqra cost?"
  }'
```

### 3. Test Sales Agent Directly

```bash
curl -X POST https://synqra.co/api/agents/sales \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to schedule a demo"
  }'
```

### 4. Dashboard UI

Visit: **https://synqra.co/agents**

Test queries:
- "How much does Synqra cost?" (Sales)
- "I can't log in" (Support)
- "I want to upgrade my plan" (Service)

---

## 📊 Monitoring

### Railway Logs

```bash
# Real-time logs
railway logs

# Filter for errors
railway logs | grep ERROR

# Filter for agent invocations
railway logs | grep "🤖"
```

### Key Metrics

**Response Times:**
- Health check: < 100ms
- Mock mode: ~1.5s
- Live mode: ~3-5s (Claude API latency)

**Success Rates:**
- Target: 99.9% success rate
- Monitor 5xx errors

**Agent Usage:**
```bash
# Get agent statistics (requires analytics setup)
curl https://synqra.co/api/agents/stats
```

---

## 🔄 Rolling Back

If something goes wrong:

### Option 1: Switch to Mock Mode

```bash
# Via Railway CLI
railway variables set AGENT_MODE="mock"

# Or via dashboard: Change AGENT_MODE to "mock"
```

### Option 2: Rollback Deployment

```bash
# Via Railway CLI
railway rollback

# Or via dashboard: Go to Deployments > Select previous > Rollback
```

---

## 🛡️ Security Checklist

After deployment:

- [ ] **Rotate API Key** - Create new Anthropic key, delete old one
- [ ] **Verify .env.local not in Git** - Run `git status`, should be ignored
- [ ] **Check Railway Variables** - Ensure secrets not exposed in logs
- [ ] **Enable Railway Logs Encryption** - In project settings
- [ ] **Set up Monitoring** - UptimeRobot or similar
- [ ] **Configure Rate Limiting** - Prevent API abuse
- [ ] **Review CORS Settings** - Ensure proper origin restrictions

---

## 🚨 Troubleshooting

### Issue: Agent returns mock responses in live mode

**Check:**
```bash
# Verify AGENT_MODE is set
railway variables | grep AGENT_MODE

# Should show: AGENT_MODE=live
```

**Fix:**
```bash
railway variables set AGENT_MODE="live"
```

### Issue: 401 Unauthorized from Claude API

**Check:**
```bash
# Verify API key is set correctly
railway variables | grep ANTHROPIC_API_KEY

# Test API key locally
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Fix:**
```bash
# Get new API key from console.anthropic.com
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-NEW_KEY"
```

### Issue: Health check fails (503)

**Check:**
```bash
# View recent logs
railway logs --tail 100

# Look for error messages
```

**Common Causes:**
- Build failed (check build logs)
- Port binding issue (verify PORT env var)
- Missing dependencies (check package.json)

**Fix:**
```bash
# Trigger rebuild
railway up --detach
```

### Issue: Slow response times

**Check:**
```bash
# Monitor Claude API latency
railway logs | grep "Claude API"
```

**Optimization:**
- Reduce AGENT_MAX_TOKENS (currently 4096)
- Enable caching for common queries
- Use async processing for long requests

---

## 📈 Performance Optimization

### 1. Enable Response Caching

Add to Railway variables:
```bash
ENABLE_RESPONSE_CACHE=true
CACHE_TTL_SECONDS=300
```

### 2. Adjust Token Limits

For faster responses:
```bash
AGENT_MAX_TOKENS=2048  # Reduce from 4096
```

### 3. Configure Timeouts

```bash
AGENT_REQUEST_TIMEOUT=30000  # 30 seconds
```

---

## 🔗 Useful Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Anthropic Console:** https://console.anthropic.com/
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Production Site:** https://synqra.co
- **Agent Dashboard:** https://synqra.co/agents
- **Health Endpoint:** https://synqra.co/api/health

---

## 📞 Support

**Issues?**
- GitHub: https://github.com/Debearr/synqra-os/issues
- Email: support@synqra.com

**Anthropic API Issues:**
- Support: https://support.anthropic.com/
- Status: https://status.anthropic.com/

**Railway Issues:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app/

---

## ✅ Deployment Checklist

Pre-deployment:
- [ ] Code committed and pushed to Git
- [ ] Build succeeds locally (`npm run build`)
- [ ] Tests pass (if any)
- [ ] Environment variables documented

Deployment:
- [ ] Railway variables set
- [ ] Deployment triggered
- [ ] Health check passes
- [ ] Agent endpoints respond
- [ ] Dashboard UI loads

Post-deployment:
- [ ] API key rotated
- [ ] Monitoring set up
- [ ] Logs reviewed
- [ ] Performance tested
- [ ] Security audit completed

---

## 🎯 Next Steps After Deployment

1. **Set Up Monitoring**
   - Add UptimeRobot for uptime monitoring
   - Configure Sentry for error tracking
   - Set up log aggregation (Logtail, Datadog)

2. **Optimize Performance**
   - Enable response caching
   - Add CDN for static assets
   - Implement request queuing

3. **Enhance Features**
   - Add voice input/output
   - Connect to real CRM
   - Implement analytics dashboard

4. **Security Hardening**
   - Add rate limiting
   - Implement API authentication
   - Set up WAF (Web Application Firewall)

5. **User Management**
   - Add user authentication
   - Implement usage tracking
   - Create admin dashboard
