# NØID LABS ECOSYSTEM

**Unified AI-Powered Platform: Synqra × NØID × AuraFX**

> Premium. Intelligent. Autonomous. Self-Healing.

---

## 🎯 WHAT IS THIS?

NØID Labs is a **masterpiece AI ecosystem** that combines:

- **Synqra**: AI-powered content generation and campaign management
- **NØID**: Digital identity and decentralized cards platform  
- **AuraFX**: Premium creative studio and design system

All powered by a **shared intelligence layer** that learns, optimizes, and evolves autonomously.

---

## 🚀 QUICK START

### 1. Clone and Setup

```bash
git clone <your-repo>
cd noid-labs-ecosystem
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

**Required Variables:**
- `ANTHROPIC_API_KEY` - Your Claude API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### 3. Run Database Migrations

```bash
psql $DATABASE_URL -f supabase/migrations/intelligence_logging.sql
psql $DATABASE_URL -f supabase/migrations/rprd_infrastructure.sql
psql $DATABASE_URL -f supabase/migrations/autonomous_infrastructure.sql
psql $DATABASE_URL -f supabase/migrations/market_intelligence.sql
```

### 4. Verify Codebase

```bash
npm run noid:verify
```

### 5. Start Development

```bash
# Synqra MVP
npm run dev:synqra

# NØID Dashboard
npm run dev:noid
```

---

## 📦 PROJECT STRUCTURE

```
/workspace/
├── shared/                      # Shared utilities (AI, DB, workflows, etc.)
│   ├── ai/                      # Unified AI client
│   ├── rprd/                    # RPRD DNA patterns
│   ├── db/                      # Supabase client + intelligence logging
│   ├── prompts/                 # Centralized prompt library
│   ├── types/                   # Shared TypeScript types
│   ├── validation/              # Validation pipeline
│   ├── workflows/               # Workflow orchestration
│   ├── cache/                   # Intelligent caching
│   ├── optimization/            # Auto-optimizer
│   ├── autonomous/              # Self-healing + evolving agents
│   ├── intelligence/            # Market watch + scrapers
│   ├── orchestration/           # System coordinator
│   └── components/luxgrid/      # Shared UI components
├── apps/
│   └── synqra-mvp/             # Synqra application
├── noid-dashboard/             # NØID Dashboard
├── noid-digital-cards/         # NØID Cards
├── n8n-workflows/              # N8N automation workflows
├── supabase/migrations/        # Database schemas
└── scripts/                    # Deployment & verification scripts
```

---

## 🛠️ NPM SCRIPTS

### Verification & Deployment
```bash
npm run noid:verify       # Verify all files present
npm run noid:preflight    # Pre-deployment checks
npm run noid:deploy       # Deploy entire ecosystem
npm run noid:test         # Post-deployment smoke tests
```

### System Management
```bash
npm run noid:status       # System health check
npm run noid:optimize     # Run optimization engine
npm run agents:evolve     # Evolve all AI agents
```

### Development
```bash
npm run dev:synqra        # Start Synqra dev server
npm run dev:noid          # Start NØID dev server
npm run build:all         # Build all workspaces
npm run lint:all          # Lint all workspaces
npm run clean             # Clean node_modules & dist
```

---

## 🔥 KEY FEATURES

### 1. **RPRD DNA System**
- Multi-version output generation
- Intelligent refine steps
- Prototype vs Polished modes
- Brand-aligned content validation

### 2. **Unified AI Client**
- Cost-aware model routing (premium/standard/cheap tiers)
- Task-based optimization
- Centralized error handling
- Usage intelligence logging

### 3. **Self-Healing Infrastructure**
- Continuous health monitoring
- Auto-detection of incidents
- Autonomous recovery strategies
- Human escalation only when necessary

### 4. **Evolving AI Agents**
- Autonomous decision-making
- Continuous learning from feedback
- Pattern recognition and adaptation
- Self-improving expertise over time

### 5. **Market Intelligence Engine**
- Zero-cost web scraping (Twitter, LinkedIn, Reddit, etc.)
- AI-powered signal detection
- Automated lead qualification
- Competitor activity tracking

### 6. **Intelligent Caching**
- Semantic content matching
- Performance-based TTL
- Auto-eviction of stale entries
- Supabase-backed persistence

### 7. **Auto-Optimization**
- Model performance analysis
- Prompt effectiveness tracking
- Workflow efficiency optimization
- Self-improving over time

### 8. **System Orchestration**
- Centralized coordination layer
- Execution locks (no race conditions)
- Clear system ownership
- Conflict-free architecture

---

## 📚 DOCUMENTATION

| Document | Description |
|----------|-------------|
| [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) | Complete pre-flight deployment checklist |
| [SYSTEM-ARCHITECTURE.md](SYSTEM-ARCHITECTURE.md) | System architecture & conflict prevention |
| [shared/README.md](shared/README.md) | Shared utilities documentation |
| [RPRD-DNA-UPGRADE-COMPLETE.md](RPRD-DNA-UPGRADE-COMPLETE.md) | RPRD DNA implementation guide |
| [AUTONOMOUS-SYSTEM-COMPLETE.md](AUTONOMOUS-SYSTEM-COMPLETE.md) | Autonomous systems documentation |
| [NOID-LABS-UPGRADE-MASTER.md](NOID-LABS-UPGRADE-MASTER.md) | Master upgrade summary |

---

## 🚀 DEPLOYMENT

### Pre-Flight Checklist

```bash
# 1. Verify codebase
npm run noid:verify

# 2. Run pre-flight checks
npm run noid:preflight

# 3. Deploy (if all checks pass)
npm run noid:deploy

# 4. Run smoke tests
npm run noid:test
```

### Railway Deployment

```bash
# Deploy individual services
cd apps/synqra-mvp && railway up
cd noid-dashboard && railway up
cd n8n-workflows && railway up
```

### Environment Variables (Railway)

Set these in Railway dashboard:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (if using direct Postgres)
- `N8N_WEBHOOK_URL` (optional)
- `SLACK_WEBHOOK_URL` (optional)

---

## 🧪 TESTING

### Run System Health Check

```bash
npm run noid:status
```

**Expected Output:**
```json
{
  "overall": "healthy",
  "ai": { "status": "healthy", "responseTime": 245 },
  "database": { "status": "healthy", "responseTime": 12 },
  "cache": { "status": "healthy", "hitRate": 0.35 }
}
```

### Test AI Client

```javascript
import { aiClient } from './shared/ai/client.ts';

const result = await aiClient.generate({
  prompt: "Write a premium tagline for NØID Labs",
  taskType: "creative",
  mode: "polished"
});

console.log(result.content);
```

### Test Intelligent Cache

```javascript
import { contentCache } from './shared/cache/intelligent-cache.ts';

await contentCache.set('test', { value: 'cached' });
const retrieved = await contentCache.get('test');
console.log(retrieved); // { value: 'cached' }
```

---

## 📊 MONITORING

### System Health
```bash
npm run noid:status
```

### Optimization Metrics
```bash
npm run noid:optimize
```

### Agent Evolution
```bash
npm run agents:evolve
```

### Database Metrics

```sql
-- Autonomy Score
SELECT * FROM get_autonomy_score('synqra');

-- Agent Performance
SELECT * FROM agent_performance_overview;

-- Intelligence Summary
SELECT * FROM intelligence_summary;

-- Lead Trends
SELECT * FROM lead_trend_insights;
```

---

## 🔧 TROUBLESHOOTING

### TypeScript Errors

```bash
cd shared/
npm install
npx tsc --noEmit
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Re-run migrations
bash scripts/deploy-all.sh
```

### Missing Files

```bash
npm run noid:verify
```

### Deployment Failures

```bash
# Check Railway logs
railway logs --tail

# Re-run pre-flight checks
npm run noid:preflight
```

---

## 🎯 BEST PRACTICES

### 1. **Always Run Pre-Flight Checks**
Never deploy without running `npm run noid:preflight` first.

### 2. **Monitor System Health**
Check `npm run noid:status` regularly, especially after deployments.

### 3. **Let Agents Evolve**
Run `npm run agents:evolve` weekly to improve agent performance.

### 4. **Review Optimization Recommendations**
Check `npm run noid:optimize` monthly for cost savings.

### 5. **Keep Documentation Updated**
Update deployment URLs and configurations in docs after each deployment.

---

## 🤝 CONTRIBUTING

### Code Standards
- TypeScript strict mode
- No `any` types
- Zod validation for all external inputs
- Clear, descriptive function names
- Brand-aligned copy (no AI slop)

### Commit Messages
```
feat: Add new autonomous recovery strategy
fix: Resolve cache eviction race condition
docs: Update deployment checklist
refactor: Consolidate AI client logic
perf: Optimize database query for leads
```

### Pull Requests
- All tests pass
- TypeScript compiles without errors
- Documentation updated
- No security vulnerabilities

---

## 📄 LICENSE

**PROPRIETARY** - NØID Labs  
All rights reserved.

---

## 💬 SUPPORT

- **Documentation**: See `/docs` folder
- **Issues**: Create GitHub issue
- **Slack**: #noid-labs-dev (if configured)

---

**Built with precision. Deployed with confidence. Maintained autonomously.**

*NØID Labs — Where intelligence evolves.*
