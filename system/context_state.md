# 🧠 SYSTEM CONTEXT STATE - NØID LABS ECOSYSTEM

**Last Updated:** 2025-11-15
**Context Version:** 1.0
**Status:** Active

---

## 🎯 CORE IDENTITY

### Brand DNA: RPRD Framework
- **R**efined: Apple-like clarity, Tesla precision
- **P**remium: Tom Ford elegance, luxury-tech positioning
- **R**ebellious: Virgil Abloh bold ideas, Off-White structure
- **D**isruptive: Challenge norms, innovate confidently

### Voice & Tone
- **De Bear Voice:** Natural, human, conversational
- **Short sentences:** Clear and direct
- **No hype:** No "amazing!!!", "crazy", "insane"
- **Confident authority:** Professional without arrogance
- **Emoji usage:** Sparingly, purposefully (not casual)

---

## 🏗️ ECOSYSTEM ARCHITECTURE

### Three Applications
1. **Synqra** - AI content engine, multi-platform creative automation
2. **NØID** - Driver assistant, scheduling, diagnostics, earnings
3. **AuraFX** - Trading signals, prop firm mode, risk engine, journal

### Tech Stack
- **Framework:** Next.js 15+ (Synqra), Next.js 16+ (NØID, NØID Cards)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** Anthropic Claude, OpenAI, DeepSeek V3, HuggingFace models
- **Deployment:** Railway
- **Automation:** n8n workflows
- **Styling:** Tailwind CSS

### Key Environment Variables
```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=

# Communications
TELEGRAM_BOT_TOKEN=
N8N_WEBHOOK_URL=

# Email
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

---

## 🤖 MULTI-AGENT SYSTEM

### Agent Types
1. **Sales Agent** - Lead qualification, pricing, demos
2. **Support Agent** - Technical help, troubleshooting
3. **Engagement Agent** - Community interaction, relationship building
4. **Reddit/Comment Agent** - Social monitoring, response automation
5. **Router Agent** - Intelligent request routing
6. **Thumbnail/Content Agent** - Creative generation (OpenCLIP)
7. **Smart Filter Agent** - Spam/toxicity detection (RoBERTa)
8. **Auto-Reply Agent** - Automated responses with context
9. **Self-Healing Agent** - System health monitoring

### Routing Logic
```typescript
// Simple queries (60%) → Route to local models
if (query.length < 100 && !requiresBrand && !isComplex) {
  return "llama-3.2-1b"; // $0 cost
}

// Medium queries (20%) → Route to DeepSeek
if (query.length < 300 && moderateComplexity) {
  return "deepseek-v3"; // $0.008 cost
}

// High/Creative (20%) → Route to Claude
if (requiresBrand || isComplex || isCreative) {
  return "claude-3.5-sonnet"; // $0.015 cost
}
```

### Token Budgets (Cost Optimization)
- **Quick:** 300 tokens max
- **Standard:** 600 tokens max
- **Detailed:** 1024 tokens max

**Default:** 1024 (down from 4096) → 75% token reduction

---

## 💰 COST OPTIMIZATION SYSTEM

### Budget Guardrails
```typescript
const BUDGET_LIMITS = {
  monthly: 200,      // $200/month HARD LIMIT
  daily: 7,          // $7/day (~$210/month buffer)
  hourly: 0.5,       // $0.50/hour
  perRequest: 0.05   // $0.05 max per request
};

const ALERT_THRESHOLDS = {
  warning: 70,    // 70% → Telegram alert
  critical: 85,   // 85% → Escalated alert
  emergency: 95   // 95% → EMERGENCY LOCK
};
```

### Pre-Request Checks
```typescript
// Before ANY API call
const budgetCheck = checkBudget(estimatedCost);
if (!budgetCheck.allowed) {
  return SAFE_FALLBACK_RESPONSE; // Block expensive requests
}
```

### Cost Tracking
- **Real-time monitoring:** `/api/budget/status`
- **Automatic alerts:** Telegram notifications at thresholds
- **Emergency lock:** System stops at 95% usage
- **Cost recording:** Every request logged with actual cost

---

## 🎨 DESIGN SYSTEM

### LuxGrid Color System
```css
/* Primary */
--luxgrid-midnight: #0A0E27;
--luxgrid-obsidian: #1A1D2E;
--luxgrid-slate: #2C3E50;

/* Accent */
--luxgrid-gold: #D4AF37;
--luxgrid-platinum: #E5E4E2;
--luxgrid-silver: #C0C0C0;

/* State */
--luxgrid-success: #10B981;
--luxgrid-warning: #F59E0B;
--luxgrid-error: #EF4444;
--luxgrid-info: #3B82F6;
```

### Typography
- **Primary:** Inter (sans-serif)
- **Display:** Space Grotesk
- **Mono:** JetBrains Mono

### Spacing Scale
```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
```

---

## 🧠 HUGGINGFACE LOCAL MODEL STACK

### Model Registry (14 Models)
```typescript
const MODELS = {
  // Local (Free)
  "llama-3.2-1b": { type: "llm", cost: 0, latency: 800 },
  "bge-small-en-v1.5": { type: "embeddings", cost: 0, latency: 100 },
  "minilm-l6-v2": { type: "similarity", cost: 0, latency: 50 },
  "distilbert-sentiment": { type: "classification", cost: 0, latency: 60 },
  "roberta-toxicity": { type: "safety", cost: 0, latency: 70 },
  "openclip-vit-b-32": { type: "vision", cost: 0, latency: 200 },
  "paddle-ocr": { type: "ocr", cost: 0, latency: 300 },
  "faster-whisper": { type: "audio", cost: 0, latency: 500 },
  "donut": { type: "document", cost: 0, latency: 400 },
  
  // API (Paid)
  "claude-3.5-sonnet": { cost: 0.015, latency: 2000 },
  "deepseek-v3": { cost: 0.008, latency: 1500 },
  "gpt-4o": { cost: 0.020, latency: 2500 },
};
```

### Intelligent Router
```typescript
// Complexity Analysis
function analyzeComplexity(query: string): Complexity {
  const length = query.length;
  const questions = (query.match(/\?/g) || []).length;
  const complexKeywords = ["explain", "compare", "analyze", "design"];
  
  if (length < 100 && questions <= 1) return "simple";
  if (length < 300 && questions <= 2) return "medium";
  if (complexKeywords.some(k => query.includes(k))) return "high";
  if (query.includes("creative") || query.includes("brand")) return "creative";
  
  return "medium";
}

// Model Selection
function routeToModel(complexity: Complexity): string {
  switch (complexity) {
    case "simple": return "llama-3.2-1b";      // 60% of queries
    case "medium": return "deepseek-v3";       // 20% of queries
    case "high": return "claude-3.5-sonnet";   // 15% of queries
    case "creative": return "claude-3.5-sonnet"; // 5% of queries
  }
}
```

### Quality Validator
```typescript
// Quality Thresholds
if (score >= 0.8) return "deliver";      // Ship to user
if (score >= 0.6) return "rephrase";     // Try again locally
if (score < 0.6) return "escalate";      // Use better model

// Quality Dimensions
- Relevance (0-1): Semantic similarity to query
- Coherence (0-1): Grammar, structure, readability
- Brand Consistency (0-1): RPRD DNA alignment
- Toxicity (0-1): Safety check (inverted)
- Accuracy (0-1): Factual correctness
```

### Self-Learning System
```typescript
// Automatic Logging
logLearningData({
  input: query,
  modelUsed: "llama-3.2-1b",
  outputQuality: 0.85,
  costEfficiency: 1.0,
  routingDecision: "simple query → local model",
  timestamp: Date.now()
});

// Weekly Optimization (Cron)
- Analyze routing effectiveness
- Adjust complexity thresholds
- Detect embedding drift
- Update model preferences
- Generate cost reports
```

---

## 🆓 FREE RESOURCES STRATEGY

### Data Sources (Zero Cost)
1. **Hacker News API** - Tech trends, discussions
2. **Reddit API** - Community insights (free tier)
3. **DEV.to API** - Developer content
4. **GitHub Trending** - Open source insights
5. **Google Trends RSS** - Search trends

### Free RAG System
- **Embeddings:** TF-IDF (local, no API)
- **Storage:** In-memory + Supabase (free tier)
- **Retrieval:** Cosine similarity (local computation)
- **Cost:** $0 (vs $50-100/month for paid embeddings)

### Static Knowledge Base
```typescript
const STATIC_KNOWLEDGE = {
  products: { synqra: {...}, noid: {...}, aurafx: {...} },
  pricing: {...},
  objectionHandling: {...},
  troubleshooting: {...}
};
```

---

## 📊 COST PROJECTIONS

### Current System (Optimized)
| Component | Monthly Cost |
|-----------|-------------|
| Claude API (tiered) | $40-60 |
| Infrastructure | $10-15 |
| **TOTAL** | **$50-75** |

### With HuggingFace Stack
| Component | Monthly Cost |
|-----------|-------------|
| Local models (80%) | $0 |
| API fallback (20%) | $20-25 |
| Python service | $10 |
| **TOTAL** | **$30-35** |

**Target:** Under $40/month (80% under budget)

---

## 🔄 DEPLOYMENT & CI/CD

### Railway Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm --prefix apps/synqra-mvp install && npm --prefix apps/synqra-mvp run build"
  },
  "deploy": {
    "startCommand": "npm --prefix apps/synqra-mvp start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Health Checks
- **Agent Health:** `/api/agents/health`
- **Budget Status:** `/api/budget/status`
- **Model Status:** `/api/models/status`
- **Database:** Supabase connection test
- **Telegram Bot:** Heartbeat ping

### GitHub Actions
- **Health Cell:** Runs every 15 minutes
- **Cost Monitor:** Daily budget check
- **Model Optimizer:** Weekly self-learning run
- **Deployment:** Auto-deploy on main branch

---

## 🛡️ SAFETY & RELIABILITY

### Error Handling
```typescript
// Triple Fallback Chain
try {
  return await localModel.infer(query);
} catch {
  try {
    return await deepseekAPI.infer(query);
  } catch {
    try {
      return await claudeAPI.infer(query);
    } catch {
      return SAFE_ERROR_RESPONSE;
    }
  }
}
```

### Rate Limiting
- **Per User:** 100 requests/hour
- **Per IP:** 200 requests/hour
- **Global:** 10,000 requests/day

### Monitoring
- **Supabase:** Database logs + RLS policies
- **Sentry:** Error tracking (optional)
- **Telegram:** Real-time alerts
- **Railway:** Infrastructure metrics

---

## 📝 CRITICAL RULES

### NEVER
❌ Exceed $200/month budget  
❌ Use high-cost models for simple queries  
❌ Ship low-quality outputs (score < 0.6)  
❌ Drift from RPRD brand DNA  
❌ Over-engineer solutions  
❌ Create unnecessary files  
❌ Break existing functionality  

### ALWAYS
✅ Check budget before API calls  
✅ Validate quality before delivery  
✅ Use tiered token budgets  
✅ Route intelligently (local first)  
✅ Log learning data  
✅ Follow RPRD brand standards  
✅ Test before deploying  
✅ Document changes  

---

## 🎯 SUCCESS METRICS

### Cost Efficiency
- Target: <$40/month (80% under budget)
- Current: ~$50-75/month (65% under budget)
- With HF: ~$30-35/month (82% under budget)

### Quality Scores
- Target: >0.75 average
- Delivery threshold: >0.8
- Escalation threshold: <0.6

### Performance
- Local model latency: <1s
- API model latency: <3s
- Total response time: <5s

### Routing Distribution
- Local: 80% (target)
- API: 20% (target)
- Cost per query: $0.003 (target)

---

## 🔗 KEY FILES & ENDPOINTS

### Documentation
- `/workspace/COST-PROTECTION-SUMMARY.md`
- `/workspace/FREE-RESOURCES-STRATEGY.md`
- `/workspace/HUGGINGFACE-DEPLOYMENT-GUIDE.md`
- `/workspace/ENVIRONMENT-SETUP-GUIDE.md`

### API Endpoints
- `GET /api/budget/status` - Budget monitoring
- `GET /api/models/status` - Model system status
- `POST /api/models/init` - Initialize local models
- `POST /api/agents` - Hybrid AI inference

### Core Code
- `apps/synqra-mvp/lib/agents/base/agent.ts` - BaseAgent
- `apps/synqra-mvp/lib/agents/budgetGuardrails.ts` - Cost protection
- `apps/synqra-mvp/lib/models/intelligentRouter.ts` - Model routing
- `apps/synqra-mvp/lib/models/qualityValidator.ts` - Quality checks
- `apps/synqra-mvp/lib/models/selfLearning.ts` - Auto-optimization

---

## 📌 CURRENT STATUS (2025-11-15)

### Completed
✅ Budget guardrails ($200/month hard limit)  
✅ Tiered token budgets (300/600/1024)  
✅ Free RAG system (TF-IDF)  
✅ HuggingFace architecture (14 models)  
✅ Intelligent routing system  
✅ Quality validation framework  
✅ Self-learning system  
✅ Hybrid agent integration  
✅ API monitoring endpoints  

### In Progress
🟡 Python model service deployment  
🟡 Shadow mode testing  
🟡 NØID/AuraFX development  

### Pending
⏳ Production rollout (80% local)  
⏳ Weekly optimization automation  
⏳ OpenCLIP brand consistency  
⏳ Multi-app integration  

---

## 🧠 CONTEXT COMPRESSION RULES

### Preserve (NEVER Compress)
- Brand DNA & voice
- Cost limits & thresholds
- Routing logic & thresholds
- Model configurations
- API endpoints
- Environment variables
- Critical file paths
- Success metrics

### Can Compress
- Implementation details (keep references)
- Historical context (keep summary)
- Exploratory discussions
- Temporary debugging
- Draft iterations

### Compression Trigger
- Context window > 45%: Summarize non-critical
- Context window > 60%: Aggressive compression
- Context window > 75%: Emergency compression

---

**END OF CONTEXT STATE**

*This file serves as the authoritative source of truth for the NØID Labs ecosystem.*  
*Reference this file to maintain consistency across all conversations and tasks.*  
*Update after major changes or implementations.*
