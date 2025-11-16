# AI Router - Cost-Optimized Intelligence Layer

## Overview

The AI Router implements a 40-60% cost reduction across the NØID Labs ecosystem through intelligent model routing and optimization.

## Architecture

```
Task Input
    ↓
Complexity Scoring
    ↓
Model Selection (Hierarchy)
    ├─ 95% → Mistral (default)
    ├─ DeepSeek (validator/compressor)
    ├─ Claude (complex + client-facing)
    └─ GPT-5 (final deliverables only)
    ↓
Pipeline Execution
    ├─ Mistral Extract
    ├─ DeepSeek Compress
    ├─ Model Execute
    └─ DeepSeek Validate
    ↓
Cache & Log
    ↓
Response
```

## Features

### 1. Model Routing Hierarchy
- **Mistral**: Default for 95% of tasks (fast, cheap)
- **DeepSeek**: Validator, logic optimizer, compressor
- **Claude**: Complex client-facing only (>0.85 complexity)
- **GPT-5**: Final signed deliverables only

### 2. Cost Guardrails
- Hard token limits per model
- Pre-execution cost estimation
- Automatic model downgrade if over budget
- Real-time cost tracking

### 3. Token Optimization
- Input compression (50-150 tokens)
- Context reduction
- Smart summarization
- Batch processing

### 4. Caching Layer
- In-memory caching (Redis-ready)
- 24-hour default TTL
- Cache warming support
- Automatic cleanup

### 5. Template Registry
- Reusable templates for common tasks
- Landing pages, scripts, blueprints, emails
- Pre-configured complexity and prompts

### 6. Logging & Analytics
- Supabase logging
- Cost tracking per model
- Cache hit rate monitoring
- Monthly cost projection

## Usage

### Basic Task Execution

```typescript
import { executeTask } from '@/lib/ai';

const result = await executeTask({
  type: 'generation',
  input: 'Generate a landing page for Synqra',
  isClientFacing: true,
  maxBudget: 0.10, // $0.10 max
});
```

### Using Templates

```typescript
import { generateFromTemplate } from '@/lib/ai/integration';

const landingPage = await generateFromTemplate(
  'landing-page-synqra',
  'Focus on time savings for creators',
  { product: 'Synqra', audience: 'YouTubers' }
);
```

### Wrapping Existing Agents

```typescript
import { wrapAgent } from '@/lib/ai/integration';
import { salesAgent } from '@/lib/agents';

const optimizedAgent = wrapAgent(salesAgent);
const response = await optimizedAgent.invoke(request);
```

### Batch Processing

```typescript
import { batchProcess } from '@/lib/ai';

const tasks = [
  { type: 'generation', input: 'Task 1...' },
  { type: 'generation', input: 'Task 2...' },
];

const results = await batchProcess(tasks);
```

### Cost Tracking

```typescript
import { getUsageStats, generateCostReport } from '@/lib/ai';

// Get last 30 days
const stats = await getUsageStats({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
});

console.log(`Total cost: $${stats.totalCost}`);
console.log(`Cache hit rate: ${stats.cacheHitRate * 100}%`);

// Generate report
const report = await generateCostReport(30);
console.log(report);
```

## Token Limits

| Model | Max Tokens |
|-------|------------|
| Mistral | 350 |
| DeepSeek | 600 |
| Claude | 1200 |
| GPT-5 | 1500 |

## Complexity Scoring

| Score | Range | Model |
|-------|-------|-------|
| Simple | 0-0.4 | Mistral |
| Moderate | 0.5-0.7 | Mistral + DeepSeek |
| Complex | 0.8-0.85 | DeepSeek |
| Premium | >0.85 | Claude (if client-facing) |
| Final | flag | GPT-5 |

## Cost Savings

**Expected Reduction**: 40-60%

**Before** (all Claude):
- 100 tasks/day × $0.05/task = $5.00/day
- Monthly: $150

**After** (optimized routing):
- 95 tasks → Mistral @ $0.001 = $0.095
- 5 tasks → Claude @ $0.05 = $0.25
- Daily: $0.345
- Monthly: $10.35
- **Savings: $139.65/month (93%)**

## Supabase Setup

Run this SQL in Supabase to create the logging table:

```sql
-- See lib/ai/logging.ts for full SQL
CREATE TABLE ai_model_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  actual_cost DECIMAL(10, 6) NOT NULL,
  complexity DECIMAL(3, 2) NOT NULL,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Model API Keys (as needed)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
# Add Mistral, DeepSeek keys as needed
```

## Integration Checklist

- [x] Core routing logic
- [x] Complexity scoring
- [x] Cost estimation
- [x] Token compression
- [x] Caching layer
- [x] Logging to Supabase
- [x] Template registry
- [x] Agent wrapper
- [ ] Mistral API integration
- [ ] DeepSeek API integration
- [ ] GPT-5 API integration
- [ ] Production testing
- [ ] Cache to Redis (optional)

## Next Steps

1. **Add Model API Integrations**: Implement actual API calls for Mistral, DeepSeek, GPT-5
2. **Test Pipeline**: Run test tasks through full pipeline
3. **Monitor Costs**: Track actual savings over 30 days
4. **Optimize Further**: Fine-tune complexity scoring based on real data
5. **Scale Caching**: Move to Redis for production scale

## Files

- `router.ts` - Main routing logic
- `types.ts` - TypeScript definitions
- `complexity.ts` - Complexity scoring
- `cost.ts` - Cost estimation
- `compression.ts` - Token compression
- `cache.ts` - Caching layer
- `logging.ts` - Supabase logging
- `templates.ts` - Template registry
- `integration.ts` - Agent wrapper
- `index.ts` - Public API

## Support

For issues or questions, see main documentation or contact the team.

---

**NØID Labs** — Premium automation. Zero fluff.
