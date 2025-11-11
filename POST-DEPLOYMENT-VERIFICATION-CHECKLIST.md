# Post-Deployment Verification Checklist
## SYNQRA OS - Safe Mode Deployment

**Generated:** 2025-11-10  
**Status:** Ready for use after deployment

---

## 🎯 IMMEDIATE CHECKS (First 5 Minutes)

### 1. Build Completion
```bash
# Check Railway logs
railway logs --deployment

# Expected:
# ✓ npm install completed
# ✓ next build succeeded
# ✓ Server started on port $PORT
```

**Success Criteria:**
- [ ] Build completed without errors
- [ ] No TypeScript compilation errors
- [ ] All dependencies installed
- [ ] Server started successfully

---

### 2. Health Endpoint
```bash
# Test health endpoint
curl https://synqra.co/api/health

# Or Railway domain
curl https://synqra-os-production.up.railway.app/api/health
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

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] Response time: < 500ms
- [ ] Status: "healthy"
- [ ] Agent mode: "mock" (safe mode)
- [ ] RAG: 10 documents
- [ ] No errors array

---

### 3. Ready Endpoint
```bash
curl https://synqra.co/api/ready
```

**Expected Response:**
```json
{
  "status": "ok",
  "ready": true,
  "timestamp": "2025-11-10T..."
}
```

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] ready: true

---

### 4. Status Endpoint (Posting Pipeline)
```bash
curl https://synqra.co/api/status
```

**Expected Response:**
```json
{
  "ok": true,
  "status": "operational",
  "config": {
    "dryRun": true,
    "postingEnabled": false,
    "approvalRequired": true
  },
  "queue": {
    "size": 0
  },
  "timestamp": "2025-11-10T..."
}
```

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] dryRun: true (safe mode)
- [ ] postingEnabled: false (safe mode)
- [ ] Queue size: 0

---

## 🤖 AGENT ENDPOINT TESTS (First 15 Minutes)

### 5. Auto-Routing Test
```bash
curl -X POST https://synqra.co/api/agents \
  -H "Content-Type: application/json" \
  -d '{"message": "How much does Synqra cost?"}'
```

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] agent: "sales" (correct routing)
- [ ] routing.confidence: > 0.8
- [ ] response.answer: Contains pricing info
- [ ] Response time: < 3s

---

### 6. Sales Agent Test
```bash
curl -X POST https://synqra.co/api/agents/sales \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to schedule a demo",
    "conversationId": "test-001"
  }'
```

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] agent: "sales"
- [ ] response.answer: Contains demo scheduling info
- [ ] response.confidence: > 0.7
- [ ] No errors

---

### 7. Support Agent Test
```bash
curl -X POST https://synqra.co/api/agents/support \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I cannot log in to my account",
    "conversationId": "test-002"
  }'
```

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] agent: "support"
- [ ] response.answer: Contains troubleshooting steps
- [ ] No errors

---

### 8. Service Agent Test
```bash
curl -X POST https://synqra.co/api/agents/service \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to upgrade my plan",
    "conversationId": "test-003"
  }'
```

**Success Criteria:**
- [ ] HTTP Status: 200 OK
- [ ] agent: "service"
- [ ] response.answer: Contains upgrade information
- [ ] No errors

---

## 🖥️ DASHBOARD UI TESTS (First 20 Minutes)

### 9. Agent Dashboard
Visit: `https://synqra.co/agents`

**Visual Checks:**
- [ ] Page loads without errors
- [ ] All UI elements visible
- [ ] Agent selector works (Auto/Sales/Support/Service)
- [ ] Chat interface functional
- [ ] Example queries displayed

**Functional Checks:**
- [ ] Can send messages
- [ ] Receives responses
- [ ] Shows confidence scores
- [ ] Displays sources (if available)
- [ ] Agent mode indicator shows "MOCK"

---

### 10. Homepage
Visit: `https://synqra.co/`

**Checks:**
- [ ] Page loads
- [ ] No console errors
- [ ] All links work
- [ ] Responsive design works

---

## 📊 MONITORING SETUP (First Hour)

### 11. Railway Logs
```bash
railway logs --tail 100
```

**Check for:**
- [ ] No error messages
- [ ] No warning messages (or only expected ones)
- [ ] Agent invocations logged correctly
- [ ] No repeated failures

---

### 12. Performance Metrics

**Response Times:**
- [ ] /api/health: < 200ms
- [ ] /api/agents: < 2s (mock mode)
- [ ] Dashboard load: < 3s

**Success Rates:**
- [ ] Health endpoint: 100% success
- [ ] Agent endpoints: > 95% success
- [ ] Dashboard: Loads consistently

---

### 13. Error Tracking
```bash
# Monitor for errors
railway logs | grep -i error

# Should be empty or minimal
```

**Check:**
- [ ] No 500 errors
- [ ] No 404 errors (except for undefined routes)
- [ ] No database connection errors
- [ ] No API authentication errors

---

## 🔐 SECURITY VERIFICATION (First Hour)

### 14. Environment Variables
```bash
# Verify mode
railway variables | grep AGENT_MODE
# Should show: mock

# Verify posting disabled
railway variables | grep POSTING_ENABLED
# Should show: false

# Verify dry run
railway variables | grep DRY_RUN
# Should show: true
```

**Checks:**
- [ ] AGENT_MODE=mock
- [ ] POSTING_ENABLED=false
- [ ] DRY_RUN=true
- [ ] No API keys exposed in logs

---

### 15. CORS & Headers
```bash
curl -I https://synqra.co/api/health
```

**Check headers:**
- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] CORS configured correctly

---

## 🚨 ROLLBACK PROCEDURES

### If Issues Detected

**Minor Issues (Logs show errors but service works):**
1. Monitor for 15 minutes
2. Check if self-recovering
3. Review specific error messages
4. Apply targeted fix if needed

**Major Issues (Service down, 500 errors, no responses):**
1. **Immediate:** Switch to mock mode if not already
   ```bash
   railway variables set AGENT_MODE=mock
   ```

2. **If still failing:** Rollback deployment
   ```bash
   railway rollback
   ```

3. **If rollback fails:** Disable service temporarily
   ```bash
   railway down
   ```

4. **Investigation:** Review logs and fix issues locally

---

## ✅ DEPLOYMENT SUCCESS CRITERIA

### All Must Pass:
- [x] Build completes successfully
- [x] Health endpoint returns healthy
- [x] All agent endpoints respond
- [x] Dashboard UI loads and functions
- [x] No critical errors in logs
- [x] Response times within targets
- [x] SAFE MODE config verified (mock=true, posting=false)

### Optional (Can fix later):
- [ ] Performance optimization
- [ ] Log aggregation setup
- [ ] Uptime monitoring configured
- [ ] Error tracking integrated

---

## 📈 ONGOING MONITORING

### Daily Checks:
- Health endpoint status
- Error rate in logs
- Response time trends

### Weekly Checks:
- Dependency updates
- Security patches
- Log review
- Performance metrics

### Monthly Checks:
- Usage analytics
- Cost analysis
- Feature requests
- Security audit

---

## 📞 EMERGENCY CONTACTS

**Railway Issues:**
- Dashboard: https://railway.app/dashboard
- Discord: https://discord.gg/railway

**Application Issues:**
- Logs: `railway logs`
- GitHub: https://github.com/Debearr/synqra-os/issues
- Deployment log: `/workspace/logs/claude-execution-2025-11-10.log`

**Anthropic API (if needed later):**
- Console: https://console.anthropic.com
- Status: https://status.anthropic.com

---

## 🎉 POST-VERIFICATION ACTIONS

### After All Checks Pass:

1. **Document Deployment**
   - Record deployment time
   - Note any issues encountered
   - Save test results
   - Update team documentation

2. **Enable Monitoring**
   - Set up UptimeRobot
   - Configure Sentry (optional)
   - Enable log aggregation

3. **Plan Next Steps**
   - Schedule live mode testing
   - Plan API key setup
   - Schedule security review
   - Plan feature additions

4. **Celebrate! 🎊**
   - Successful SAFE MODE deployment
   - Zero-risk production testing
   - Ready for gradual activation

---

**Checklist Version:** 1.0  
**Last Updated:** 2025-11-10  
**Deployment Mode:** SAFE MODE (Mock)
