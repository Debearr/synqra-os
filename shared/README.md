# NØID Labs Shared Utilities

**Unified codebase for Synqra × NØID × AuraFX ecosystem**

## 🎯 Purpose

Reduce redundancy, optimize costs, and maintain consistency across all NØID Labs products.

## 📦 What's Inside

### `/ai` - Unified AI Client
- **Cost-aware routing**: Automatically selects optimal model tier based on task
- **Premium tier**: Creative and strategic tasks (Claude Sonnet)
- **Standard tier**: Structural tasks (optimized models)
- **Cheap tier**: Formatting and refining (cost-efficient models)

```typescript
import { aiClient, generateCreative } from '@/shared';

// Automatic cost-aware routing
const result = await aiClient.generate({
  prompt: "Write executive email",
  taskType: "strategic", // Uses premium model
  mode: "polished"
});

// Quick helpers
const creative = await generateCreative("Campaign concept for luxury brand");
const refined = await refineContent(draftContent);
```

### `/rprd` - RPRD DNA Patterns
**Rules • Protocols • Refinements • Directives**

Core patterns for consistent, premium output:
- **Multi-version output**: Generate A/B variants automatically
- **Refine step**: Cheap polish pass for tighter content
- **Prototype vs Polished modes**: Fast iteration vs full quality
- **Brand voice validation**: Rule-based checks (zero cost)

```typescript
import { generateWithRPRD, generateABVariants, validateBrandVoice } from '@/shared';

// Generate with RPRD DNA
const output = await generateWithRPRD({
  content: "Product launch email",
  type: "email",
  mode: "polished",
  multiVersion: true,  // Get A/B variants
  refinePass: true     // Add cheap polish step
});

// A/B variant generation
const { variantA, variantB } = await generateABVariants(
  "Social media campaign hook",
  "social"
);

// Validate brand voice (no AI cost)
const validation = validateBrandVoice(content);
if (!validation.passed) {
  console.log("Issues:", validation.issues);
}
```

### `/db` - Unified Supabase Client
- **Single source of truth** for database access
- **Intelligence logging**: Track what works, reuse successful patterns
- **Recipe tracking**: Learn from high-performing content structures
- **Zero additional cost**: Uses existing Supabase instance

```typescript
import { 
  getSupabaseClient, 
  logIntelligence, 
  trackRecipeUsage,
  getTopRecipes 
} from '@/shared';

const supabase = getSupabaseClient();

// Log AI operations for intelligence gathering
await logIntelligence({
  app: "synqra",
  operation: "generate_email",
  model_used: "claude-3-5-sonnet",
  model_tier: "premium",
  input_tokens: 150,
  output_tokens: 450,
  success: true
});

// Track recipe usage
await trackRecipeUsage({
  recipe_type: "email_template",
  recipe_name: "executive_outreach_v2",
  app: "synqra"
});

// Get top-performing recipes
const topRecipes = await getTopRecipes("email_template", 10);
```

### `/components` - Shared UI (LuxGrid)
**Luxury design system components**

```typescript
import { Card, CTAButton, Logo } from '@/shared/components/luxgrid';

<Card variant="dark" padding="lg">
  <Logo />
  <CTAButton variant="primary" size="lg">
    Join Waitlist
  </CTAButton>
</Card>
```

## 🚀 Usage Across Apps

### In Synqra MVP
```typescript
// Before: Direct Anthropic calls, hardcoded model
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022", // Hardcoded
  // ...
});

// After: Cost-aware, shared, intelligent
import { aiClient, logIntelligence } from '@/shared';
const response = await aiClient.generate({
  prompt: userInput,
  taskType: "creative", // Auto-selects best model
  mode: "polished"
});
await logIntelligence({ app: "synqra", operation: "generate", success: true });
```

### In NØID Dashboard
```typescript
import { generateWithRPRD, getSupabaseClient } from '@/shared';

const supabase = getSupabaseClient();
const content = await generateWithRPRD({
  content: "Dashboard welcome message",
  type: "copy",
  mode: "polished"
});
```

### In AuraFX (Future)
```typescript
import { generateABVariants, trackRecipeUsage } from '@/shared';

const { variantA, variantB } = await generateABVariants(
  "Campaign analysis insight",
  "campaign"
);
await trackRecipeUsage({
  recipe_type: "insight_template",
  recipe_name: "engagement_drop_alert",
  app: "aurafx"
});
```

## 📊 Intelligence Gathering

The shared utilities automatically track:
- **What AI operations are performed** (and their cost)
- **Which models are used most** (optimization insights)
- **Which recipes/patterns succeed** (reuse high-performers)
- **User preferences** (A/B test winners)

All stored in **existing Supabase** (zero additional infrastructure cost).

### View Intelligence Metrics
```typescript
import { getIntelligenceMetrics } from '@/shared';

const metrics = await getIntelligenceMetrics("synqra");
console.log(metrics);
// {
//   totalOperations: 1250,
//   successRate: 98,
//   totalTokens: 2400000,
//   topOperations: [...]
// }
```

## 🎨 Design Principles

All shared code follows **NØID Labs DNA**:
- ✅ Premium quality, no quality loss
- ✅ Cost-efficient, smart routing
- ✅ No new paid services
- ✅ Clean, understandable code
- ✅ Luxury positioning
- ✅ No AI slop, no marketing fluff

## 🔧 Setup

1. **Install dependencies** (already in monorepo):
   ```bash
   # @anthropic-ai/sdk and @supabase/supabase-js already installed
   ```

2. **Set environment variables**:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   ```

3. **Run Supabase migration**:
   ```bash
   # Intelligence logging tables
   psql -f supabase/migrations/intelligence_logging.sql
   ```

4. **Import and use**:
   ```typescript
   import { aiClient, generateWithRPRD, getSupabaseClient } from '@/shared';
   ```

## 📈 Cost Optimization Strategy

| Task Type | Old Approach | New Approach | Savings |
|-----------|-------------|--------------|---------|
| Creative content | Always premium model | Premium model (optimized) | Smart routing |
| Structural work | Premium model | Standard model | ~30-50% tokens |
| Refining/polish | Premium model | Cheap model | ~50-70% tokens |
| Formatting | Premium model | Cheap model | ~70% tokens |

**Intelligence gathering** helps us learn which approaches work best → reuse successful patterns → reduce unnecessary generation.

## 🛠️ Future Enhancements

- [ ] Add Haiku model support for ultra-cheap tasks
- [ ] Auto-select "winner" in A/B tests based on engagement
- [ ] Cache common prompts/responses (Redis/Upstash)
- [ ] More shared components (forms, modals, etc.)
- [ ] Cross-app analytics dashboard

## 📝 Migration Guide

See individual app migration docs:
- [Synqra Migration](../apps/synqra-mvp/docs/SHARED_MIGRATION.md)
- [NØID Dashboard Migration](../noid-dashboard/docs/SHARED_MIGRATION.md)

---

**Built with precision for the NØID Labs ecosystem**  
*Synqra × NØID × AuraFX*
