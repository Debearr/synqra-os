# Railway Deployment Guide - SYNQRA OS
## Generated: 2025-11-10 | SAFE MODE READY

---

## 🚨 PRE-DEPLOYMENT CHECKLIST

### ✅ Completed (Safe Mode)
- [x] Repository status verified (clean)
- [x] Build succeeds locally (0 errors)
- [x] All API routes functional
- [x] Health checks passing
- [x] Environment variables configured
- [x] Railway configuration validated

### ⏳ Ready for Deployment
- [ ] Railway project created/selected
- [ ] Environment variables set in Railway
- [ ] Domain configured (synqra.co)
- [ ] Deployment triggered
- [ ] Production health check verified

---

## 🔧 RAILWAY CONFIGURATION

### Project Structure
- **Type:** Monorepo
- **App Location:** `/apps/synqra-mvp`
- **Builder:** NIXPACKS
- **Node Version:** 18+ (auto-detected)

### Build Configuration
```json
{
  "builder": "NIXPACKS",
  "buildCommand": "npm --prefix apps/synqra-mvp run build"
}
```

### Deploy Configuration
```json
{
  "startCommand": "npm --prefix apps/synqra-mvp run start",
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 10
}
```

---

## 🔐 REQUIRED ENVIRONMENT VARIABLES

### SAFE MODE (Mock - No API Keys Required)
```bash
# Agent Configuration
AGENT_MODE=mock
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.7

# RAG Configuration
RAG_ENABLED=true
RAG_MAX_DOCUMENTS=5
RAG_MIN_SIMILARITY=0.7

# Safety & Guardrails
HALLUCINATION_CHECK=true
DUAL_PASS_VALIDATION=true
MIN_CONFIDENCE_THRESHOLD=0.6

# Development
DEBUG_AGENTS=false
NODE_ENV=production

# Posting Pipeline (SAFE MODE)
POSTING_ENABLED=false
DRY_RUN=true
APPROVAL_REQUIRED=true

# Supabase (Mock - for build only)
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_service_key
```

### LIVE MODE (Requires API Keys)
```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
AGENT_MODE=live

# Supabase (Real Credentials)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Optional: Posting Pipeline
POSTING_ENABLED=true
DRY_RUN=false
LINKEDIN_CLIENT_ID=YOUR_LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET=YOUR_LINKEDIN_CLIENT_SECRET
```

---

## 🚀 DEPLOYMENT METHODS

### Method 1: Railway Dashboard (Recommended for Safe Mode)

1. **Login to Railway**
   ```
   https://railway.app/dashboard
   ```

2. **Select/Create Project**
   - Project Name: `synqra-os`
   - Service Name: `synqra-mvp`

3. **Connect Repository**
   - Repository: `Debearr/synqra-os`
   - Branch: `cursor/execute-synqra-os-deployment-safe-mode-6aaf`
   - Root Directory: Leave as `/`

4. **Set Environment Variables**
   - Go to Variables tab
   - Click "RAW Editor"
   - Paste SAFE MODE variables (see above)
   - Click "Deploy"

5. **Configure Domain**
   - Go to Settings > Domains
   - Add custom domain: `synqra.co`
   - Update DNS (CNAME): `synqra-os-production.up.railway.app`

### Method 2: Railway CLI

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link project (if exists)
railway link

# Or create new project
railway init

# Set environment variables (SAFE MODE)
railway variables set AGENT_MODE=mock
railway variables set RAG_ENABLED=true
railway variables set POSTING_ENABLED=false
railway variables set DRY_RUN=true
railway variables set DEBUG_AGENTS=false
railway variables set NODE_ENV=production

# Supabase (mock for build)
railway variables set SUPABASE_URL=https://placeholder.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_key
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_service_key

# Deploy
railway up
```

### Method 3: Automated Script

```bash
# Use the configure-railway.sh script
./scripts/configure-railway.sh

# Follow the prompts
```

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### 1. Check Build Logs
```bash
railway logs --deployment
```

**Expected Output:**
- ✓ Dependencies installed
- ✓ Build completed successfully
- ✓ Server started on port 8080

### 2. Test Health Endpoint
```bash
curl https://synqra.co/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T...",
  "services": {
    "agents": {
      "status": "healthy",
      "mode": "mock",
      "errors": []
    },
    "rag": {
      "status": "healthy",
      "documentsCount": 10,
      "categoriesCount": 10
    }
  },
  "version": "1.0.0"
}
```

### 3. Test Agent Endpoints

**Auto-routing:**
```bash
curl -X POST https://synqra.co/api/agents \
  -H "Content-Type: application/json" \
  -d '{"message": "How much does Synqra cost?"}'
```

**Sales Agent:**
```bash
curl -X POST https://synqra.co/api/agents/sales \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to schedule a demo"}'
```

### 4. Test Dashboard UI
Visit: `https://synqra.co/agents`

Test queries:
- "How much does Synqra cost?" → Sales
- "I can't log in" → Support
- "I want to upgrade my plan" → Service

---

## 🔄 SWITCHING MODES

### Mock Mode → Live Mode

```bash
# Set API key
railway variables set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Switch to live mode
railway variables set AGENT_MODE=live

# Optional: Enable posting (after thorough testing)
railway variables set POSTING_ENABLED=true
railway variables set DRY_RUN=false

# Redeploy
railway up
```

### Live Mode → Mock Mode (Rollback)

```bash
railway variables set AGENT_MODE=mock
# Railway auto-redeploys
```

---

## 🚨 TROUBLESHOOTING

### Build Fails
```bash
# Check logs
railway logs --deployment

# Common issues:
# - Missing node_modules (solution: rebuild)
# - TypeScript errors (solution: fix locally first)
# - Missing env vars (solution: add required vars)
```

### Health Check Fails
```bash
# Check application logs
railway logs

# Common issues:
# - Port binding (Railway sets PORT automatically)
# - Missing dependencies
# - Environment variable issues
```

### Agents Return Errors
```bash
# Check mode
railway variables | grep AGENT_MODE

# If live mode, check API key
railway variables | grep ANTHROPIC_API_KEY

# Switch to mock mode for testing
railway variables set AGENT_MODE=mock
```

---

## 📊 MONITORING

### Key Metrics to Monitor
- Response times (target: < 5s for live mode)
- Error rates (target: < 1%)
- Health check status (should always be 200)
- Agent invocation counts
- API quota usage (Anthropic)

### Recommended Tools
- **Uptime:** UptimeRobot (https://uptimerobot.com)
- **Errors:** Sentry (https://sentry.io)
- **Logs:** Railway built-in logs
- **Analytics:** Vercel Analytics or Plausible

---

## 🔒 SECURITY CHECKLIST

### Pre-Deployment
- [x] API keys not in git
- [x] .env.local gitignored
- [x] Environment variables in Railway only
- [x] Safe mode enabled by default

### Post-Deployment
- [ ] Rotate Anthropic API key
- [ ] Enable Railway log encryption
- [ ] Configure rate limiting
- [ ] Set up CORS properly
- [ ] Review security headers
- [ ] Enable HTTPS (automatic with Railway)

---

## 📞 SUPPORT

### Railway Issues
- Dashboard: https://railway.app/dashboard
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

### Anthropic API Issues
- Console: https://console.anthropic.com
- Status: https://status.anthropic.com
- Support: https://support.anthropic.com

### Application Issues
- GitHub: https://github.com/Debearr/synqra-os/issues
- Logs: `/workspace/logs/claude-execution-2025-11-10.log`

---

## ✅ SAFE MODE DEPLOYMENT SUMMARY

### What's Deployed
- Multi-agent system (Sales, Support, Service) ✓
- RAG knowledge retrieval ✓
- Safety guardrails ✓
- Health monitoring ✓
- Mock mode (no API costs) ✓

### What's NOT Active
- Live Claude API calls (mock mode)
- Social media posting (disabled)
- Real database operations (placeholder)

### Ready for Production?
**SAFE MODE:** ✅ Yes - Can deploy safely with mock mode

**LIVE MODE:** ⚠️ Requires:
1. Valid Anthropic API key
2. Real Supabase credentials
3. Thorough testing in staging
4. API key rotation plan
5. Monitoring setup

---

**Generated:** 2025-11-10
**Status:** READY FOR SAFE MODE DEPLOYMENT
**Next Step:** Set environment variables in Railway and deploy
