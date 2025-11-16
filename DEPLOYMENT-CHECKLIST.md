# DEPLOYMENT CHECKLIST - NØID LABS
## Pre-Flight Verification for Production Deployment

**Complete this checklist BEFORE every deployment. Zero tolerance for errors.**

---

## ✅ PHASE 1: CODE VERIFICATION

### 1.1 File Structure Complete

```bash
# Verify all critical directories exist
ls -la shared/
ls -la shared/ai/
ls -la shared/rprd/
ls -la shared/db/
ls -la shared/prompts/
ls -la shared/types/
ls -la shared/validation/
ls -la shared/workflows/
ls -la shared/cache/
ls -la shared/optimization/
ls -la shared/autonomous/
ls -la shared/intelligence/
ls -la shared/orchestration/
ls -la shared/dev/
ls -la shared/components/luxgrid/
ls -la supabase/migrations/
ls -la n8n-workflows/
```

**Expected:** All directories present, no 404s

---

### 1.2 Critical Files Present

```bash
# Core shared files
test -f shared/index.ts && echo "✓ shared/index.ts" || echo "✗ MISSING: shared/index.ts"
test -f shared/package.json && echo "✓ shared/package.json" || echo "✗ MISSING: shared/package.json"
test -f shared/tsconfig.json && echo "✓ shared/tsconfig.json" || echo "✗ MISSING: shared/tsconfig.json"

# AI & Content
test -f shared/ai/client.ts && echo "✓ AI Client" || echo "✗ MISSING: AI Client"
test -f shared/rprd/patterns.ts && echo "✓ RPRD Patterns" || echo "✗ MISSING: RPRD Patterns"
test -f shared/prompts/library.ts && echo "✓ Prompt Library" || echo "✗ MISSING: Prompt Library"
test -f shared/validation/index.ts && echo "✓ Validation" || echo "✗ MISSING: Validation"

# Data & Intelligence
test -f shared/db/supabase.ts && echo "✓ Supabase Client" || echo "✗ MISSING: Supabase Client"
test -f shared/types/index.ts && echo "✓ Types" || echo "✗ MISSING: Types"
test -f shared/cache/intelligent-cache.ts && echo "✓ Cache" || echo "✗ MISSING: Cache"

# Workflows & Orchestration
test -f shared/workflows/orchestrator.ts && echo "✓ Workflows" || echo "✗ MISSING: Workflows"
test -f shared/orchestration/system-coordinator.ts && echo "✓ Coordinator" || echo "✗ MISSING: Coordinator"

# Autonomous Systems
test -f shared/autonomous/self-healing.ts && echo "✓ Self-Healing" || echo "✗ MISSING: Self-Healing"
test -f shared/autonomous/evolving-agents.ts && echo "✓ Agents" || echo "✗ MISSING: Agents"

# Market Intelligence
test -f shared/intelligence/market-watch.ts && echo "✓ Market Intelligence" || echo "✗ MISSING: Market Intelligence"
test -f shared/intelligence/scrapers.ts && echo "✓ Scrapers" || echo "✗ MISSING: Scrapers"
test -f shared/intelligence/decision-engine.ts && echo "✓ Decision Engine" || echo "✗ MISSING: Decision Engine"

# Optimization
test -f shared/optimization/auto-optimizer.ts && echo "✓ Auto-Optimizer" || echo "✗ MISSING: Auto-Optimizer"
test -f shared/dev/tools.ts && echo "✓ Dev Tools" || echo "✗ MISSING: Dev Tools"

# Database Migrations
test -f supabase/migrations/intelligence_logging.sql && echo "✓ Intelligence Migration" || echo "✗ MISSING"
test -f supabase/migrations/rprd_infrastructure.sql && echo "✓ RPRD Migration" || echo "✗ MISSING"
test -f supabase/migrations/autonomous_infrastructure.sql && echo "✓ Autonomous Migration" || echo "✗ MISSING"
test -f supabase/migrations/market_intelligence.sql && echo "✓ Market Intel Migration" || echo "✗ MISSING"

# Documentation
test -f shared/README.md && echo "✓ Shared README" || echo "✗ MISSING: Shared README"
test -f RPRD-DNA-UPGRADE-COMPLETE.md && echo "✓ RPRD Docs" || echo "✗ MISSING"
test -f AUTONOMOUS-SYSTEM-COMPLETE.md && echo "✓ Autonomous Docs" || echo "✗ MISSING"
test -f NOID-LABS-UPGRADE-MASTER.md && echo "✓ Master Docs" || echo "✗ MISSING"
test -f SYSTEM-ARCHITECTURE.md && echo "✓ Architecture Docs" || echo "✗ MISSING"
```

**Action:** If ANY file is missing, STOP deployment and create it.

---

### 1.3 TypeScript Compilation

```bash
cd shared/
npm install
npx tsc --noEmit

# Expected: No errors
```

**Action:** Fix ALL TypeScript errors before proceeding.

---

### 1.4 Import Validation

```bash
# Check that all imports resolve
node -e "
const fs = require('fs');
const files = fs.readdirSync('shared', { recursive: true });
files.forEach(file => {
  if (file.endsWith('.ts')) {
    console.log('Checking:', file);
  }
});
"
```

**Action:** Ensure no broken imports.

---

## ✅ PHASE 2: ENVIRONMENT CONFIGURATION

### 2.1 Required Environment Variables

```bash
# Core services
echo "Checking ANTHROPIC_API_KEY..." && test -n "$ANTHROPIC_API_KEY" && echo "✓" || echo "✗ MISSING"
echo "Checking SUPABASE_URL..." && test -n "$SUPABASE_URL" && echo "✓" || echo "✗ MISSING"
echo "Checking SUPABASE_ANON_KEY..." && test -n "$SUPABASE_ANON_KEY" && echo "✓" || echo "✗ MISSING"
echo "Checking SUPABASE_SERVICE_ROLE_KEY..." && test -n "$SUPABASE_SERVICE_ROLE_KEY" && echo "✓" || echo "✗ MISSING"

# Optional but recommended
echo "Checking N8N_WEBHOOK_URL..." && test -n "$N8N_WEBHOOK_URL" && echo "✓" || echo "⚠ Optional"
echo "Checking SLACK_WEBHOOK_URL..." && test -n "$SLACK_WEBHOOK_URL" && echo "✓" || echo "⚠ Optional"
```

**Action:** Set ALL required variables. Optional ones enhance functionality.

---

### 2.2 Environment File Template

Create `.env` (DO NOT commit to git):

```bash
# Copy template
cp .env.example .env

# Edit with real values
nano .env
```

**Required Variables:**
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Optional Variables:**
```
N8N_WEBHOOK_URL=https://your-n8n.railway.app
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
NODE_ENV=production
```

---

## ✅ PHASE 3: DATABASE SETUP

### 3.1 Run Migrations

```bash
# Verify database connection
psql $DATABASE_URL -c "SELECT 1"

# Run migrations in order
psql $DATABASE_URL -f supabase/migrations/intelligence_logging.sql
psql $DATABASE_URL -f supabase/migrations/rprd_infrastructure.sql
psql $DATABASE_URL -f supabase/migrations/autonomous_infrastructure.sql
psql $DATABASE_URL -f supabase/migrations/market_intelligence.sql

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

**Expected Tables:**
- `intelligence_logs`
- `recipe_usage`
- `content_performance`
- `cache_entries`
- `optimization_rules`
- `optimization_logs`
- `incidents`
- `recovery_strategies`
- `agent_profiles`
- `agent_interactions`
- `learning_patterns`
- `market_signals`
- `leads`
- `competitor_activity`
- `trend_insights`
- `lead_scoring_rules`

**Action:** If ANY table is missing, re-run migrations.

---

### 3.2 Verify Database Functions

```bash
# Test key functions
psql $DATABASE_URL -c "SELECT get_autonomy_score('synqra');"
psql $DATABASE_URL -c "SELECT * FROM intelligence_summary LIMIT 1;"
psql $DATABASE_URL -c "SELECT * FROM agent_performance_overview LIMIT 1;"
```

**Action:** All functions should execute without errors.

---

## ✅ PHASE 4: INTEGRATION TESTS

### 4.1 AI Client Test

```typescript
// Run: node test-ai-client.mjs
import { aiClient } from './shared/ai/client.ts';

const result = await aiClient.generate({
  prompt: "Test prompt",
  taskType: "formatting",
  maxTokens: 50
});

console.log(result.content.length > 0 ? "✓ AI Client working" : "✗ AI Client failed");
```

---

### 4.2 Database Client Test

```typescript
// Run: node test-db.mjs
import { getSupabaseClient } from './shared/db/supabase.ts';

const supabase = getSupabaseClient();
const { error } = await supabase.from('intelligence_logs').select('id').limit(1);

console.log(!error ? "✓ Database working" : "✗ Database failed");
```

---

### 4.3 Cache Test

```typescript
// Run: node test-cache.mjs
import { contentCache } from './shared/cache/intelligent-cache.ts';

await contentCache.set('test_key', { test: 'value' });
const retrieved = await contentCache.get('test_key');

console.log(retrieved ? "✓ Cache working" : "✗ Cache failed");
```

---

### 4.4 System Health Check

```bash
# Run comprehensive health check
npm run noid:status

# Or manually:
node -e "
import { runDiagnostics } from './shared/dev/tools.ts';
const health = await runDiagnostics('synqra');
console.log('Overall:', health.overall);
console.log('AI:', health.ai.status);
console.log('Database:', health.database.status);
console.log('Cache:', health.cache.status);
"
```

**Expected:** All systems "healthy"

---

## ✅ PHASE 5: DEPLOYMENT

### 5.1 Synqra MVP Deployment (Railway)

```bash
cd apps/synqra-mvp/

# Build
npm run build

# Test build
npm run start &
curl http://localhost:3004/api/health
kill %1

# Deploy to Railway
railway up

# Verify
curl https://your-synqra.railway.app/api/health
```

**Expected:** `{ "status": "healthy" }`

---

### 5.2 NØID Dashboard Deployment (Railway)

```bash
cd noid-dashboard/

# Build
npm run build

# Test build
npm run start &
curl http://localhost:3000/
kill %1

# Deploy
railway up

# Verify
curl https://your-noid.railway.app/
```

**Expected:** 200 OK

---

### 5.3 N8N Deployment (Railway)

```bash
cd n8n-workflows/

# Deploy
railway up

# Verify
curl https://your-n8n.railway.app/healthz
```

**Expected:** 200 OK

---

### 5.4 Initialize Autonomous Systems

```bash
# Start self-healing and agents
node -e "
import { startSelfHealing, agentFleet } from './shared/index.ts';

// Start self-healing
startSelfHealing('synqra');

// Pre-load agents
await agentFleet.getAgent('sales', 'synqra');
await agentFleet.getAgent('support', 'synqra');
await agentFleet.getAgent('service', 'synqra');

console.log('✓ Autonomous systems initialized');
"
```

---

## ✅ PHASE 6: POST-DEPLOYMENT VERIFICATION

### 6.1 Smoke Tests

```bash
# Test critical endpoints
curl -X POST https://your-synqra.railway.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test","type":"copy"}' \
  | jq '.success'

# Expected: true
```

---

### 6.2 Monitor First Hour

```bash
# Watch logs
railway logs --tail

# Check for errors (should be none)
railway logs | grep ERROR

# Check system health
psql $DATABASE_URL -c "SELECT * FROM get_autonomy_score('synqra');"
```

**Expected Metrics (within 1 hour):**
- No critical errors
- Autonomy score: 50+ (will increase over time)
- All services responding

---

### 6.3 Verify Key Workflows

```bash
# Test lead processing
node -e "
import { SystemCoordinator } from './shared/index.ts';
// Create test lead
// Process it
// Verify it routed correctly
console.log('✓ Lead workflow working');
"

# Test agent response
node -e "
import { processWithAgent } from './shared/index.ts';
const decision = await processWithAgent('support', 'synqra', 'Test query');
console.log(decision.action === 'respond' ? '✓ Agent working' : '✗ Agent failed');
"
```

---

## ✅ PHASE 7: MONITORING SETUP

### 7.1 Set Up Alerts

```bash
# Configure Railway to send alerts on:
- Deployment failures
- High memory usage (>80%)
- High error rate (>1%)
- Service downtime

# Configure Slack notifications
# Set SLACK_WEBHOOK_URL in Railway env vars
```

---

### 7.2 Schedule Health Checks

```bash
# Add cron job for daily health check
railway cron add "0 9 * * *" "npm run noid:status"

# Add cron job for daily optimization
railway cron add "0 3 * * *" "npm run noid:optimize"

# Add cron job for agent evolution
railway cron add "0 4 * * *" "npm run agents:evolve"
```

---

### 7.3 Dashboard Access

```bash
# Verify dashboards accessible:
echo "Synqra: https://your-synqra.railway.app"
echo "NØID: https://your-noid.railway.app"
echo "N8N: https://your-n8n.railway.app"
echo "Railway: https://railway.app/dashboard"
echo "Supabase: https://app.supabase.com"
```

---

## ✅ PHASE 8: DOCUMENTATION

### 8.1 Update Deployment Logs

```bash
# Create deployment record
cat >> DEPLOYMENT_LOG.md << EOF

## Deployment $(date +%Y-%m-%d_%H:%M:%S)

- **Synqra MVP:** Deployed to Railway
- **NØID Dashboard:** Deployed to Railway
- **N8N Workflows:** Deployed to Railway
- **Database Migrations:** All applied successfully
- **Autonomous Systems:** Initialized and running
- **Health Status:** All systems healthy

### Metrics Baseline
- Autonomy Score: $(psql $DATABASE_URL -t -c "SELECT autonomy_score FROM get_autonomy_score('synqra');")
- Agent Expertise: 50 (starting baseline)
- Cache Hit Rate: 0% (will increase over time)

EOF
```

---

### 8.2 Team Onboarding

```bash
# Share access with team:
- Railway project access
- Supabase project access
- N8N credentials
- Documentation links
```

---

## ✅ PHASE 9: ROLLBACK PLAN

### 9.1 Prepare Rollback

```bash
# Save current state
railway rollback --dry-run

# Document rollback steps
echo "If deployment fails:
1. railway rollback
2. Revert database migrations
3. Restore previous env vars
4. Notify team
" > ROLLBACK_PROCEDURE.md
```

---

### 9.2 Rollback Database (if needed)

```sql
-- Revert migrations in reverse order
DROP TABLE IF EXISTS lead_scoring_rules CASCADE;
DROP TABLE IF EXISTS trend_insights CASCADE;
DROP TABLE IF EXISTS competitor_activity CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS market_signals CASCADE;
DROP TABLE IF EXISTS learning_patterns CASCADE;
DROP TABLE IF EXISTS agent_interactions CASCADE;
DROP TABLE IF EXISTS agent_profiles CASCADE;
DROP TABLE IF EXISTS recovery_strategies CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS optimization_logs CASCADE;
DROP TABLE IF EXISTS optimization_rules CASCADE;
DROP TABLE IF EXISTS cache_entries CASCADE;
DROP TABLE IF EXISTS content_performance CASCADE;
DROP TABLE IF EXISTS recipe_usage CASCADE;
DROP TABLE IF EXISTS intelligence_logs CASCADE;
```

---

## ✅ PHASE 10: SUCCESS CRITERIA

### Deployment is successful when:

- [x] All files present (no 404s)
- [x] TypeScript compiles without errors
- [x] All environment variables set
- [x] All database migrations applied
- [x] All integration tests pass
- [x] All services deployed to Railway
- [x] All health checks pass
- [x] Autonomous systems initialized
- [x] No critical errors in logs (first hour)
- [x] Smoke tests pass
- [x] Monitoring and alerts configured
- [x] Documentation updated
- [x] Team notified and onboarded
- [x] Rollback plan documented

---

## 🚨 FAILURE CONDITIONS (STOP DEPLOYMENT)

### STOP if ANY of these occur:

- ❌ TypeScript compilation errors
- ❌ Missing required environment variables
- ❌ Database migration failures
- ❌ Integration test failures
- ❌ Health check failures
- ❌ Critical errors during deployment
- ❌ Services not responding after deployment

**Action:** Investigate, fix, and restart checklist from Phase 1.

---

## 📊 POST-DEPLOYMENT METRICS (Track Over Time)

### Week 1
- Autonomy Score: 50-60 (baseline → learning)
- Agent Expertise: 50-60 (baseline → improving)
- Auto-Resolution Rate: 60-70%
- Cache Hit Rate: 10-20%

### Month 1
- Autonomy Score: 70-80
- Agent Expertise: 65-75
- Auto-Resolution Rate: 80-90%
- Cache Hit Rate: 25-35%

### Month 3
- Autonomy Score: 85-92 (target: 90+)
- Agent Expertise: 80-90 (target: 85+)
- Auto-Resolution Rate: 95-98% (target: 95%+)
- Cache Hit Rate: 35-45%

---

## 🎯 MAINTENANCE SCHEDULE

### Daily
- Monitor logs for errors
- Check autonomy score
- Review agent performance

### Weekly
- Review intelligence digest
- Check lead conversion rates
- Optimize underperforming workflows

### Monthly
- System health audit
- Agent evolution review
- Cost optimization analysis
- Security updates

---

**Use this checklist for EVERY deployment. Zero tolerance for skipping steps.**

**Deployment without this checklist = Deployment failure.**

---

**Built for reliability. Deployed with confidence. Maintained with precision.**

*NØID Labs Deployment Protocol*
