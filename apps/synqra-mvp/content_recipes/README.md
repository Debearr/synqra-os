# Content Recipes - Synqra Creative Templates

## Overview

Content Recipes are production-ready templates for generating high-quality creative content using the AI Router. Each recipe includes:
- Complete prompt structure
- Variable placeholders
- AI Router configuration
- Cost estimates
- Usage examples
- Expected output format

## Why Content Recipes?

**Without Recipes:**
- Inconsistent outputs
- Trial-and-error prompting
- Wasted tokens on refinements
- No cost predictability
- Hard to replicate success

**With Recipes:**
- Proven templates
- Consistent quality
- Predictable costs
- Reusable across clients
- Faster iteration

## Recipe Structure

```
content_recipes/
├── README.md (this file)
├── campaigns/
│   ├── try_on_react_campaign.md       # Video campaign template
│   ├── product_launch_campaign.md     # Product launch
│   └── ugc_campaign.md                # User-generated content
├── social/
│   ├── youtube_hooks.md               # YouTube hooks + scripts
│   ├── tiktok_hooks.md                # TikTok content
│   ├── instagram_captions.md          # IG captions
│   └── twitter_threads.md             # Twitter/X threads
├── landing_pages/
│   ├── synqra_landing.md              # Synqra landing pages
│   ├── noid_landing.md                # NØID landing pages
│   └── aurafx_landing.md              # AuraFX landing pages
├── emails/
│   ├── follow_up_sequence.md          # Email sequences
│   ├── nurture_campaign.md            # Nurture emails
│   └── announcement_email.md          # Announcements
└── blueprints/
    ├── client_blueprint.md            # Client blueprints
    └── roi_calculator.md              # ROI calculators
```

## Using a Recipe

### Method 1: Direct Execution

```typescript
import { executeTask } from '@/lib/ai';
import fs from 'fs';

// Load recipe template
const recipeTemplate = fs.readFileSync(
  'content_recipes/try_on_react_campaign.md',
  'utf-8'
);

// Execute with variables
const result = await executeTask({
  type: 'generation',
  input: `
    BRAND_NAME: "Your Brand"
    COLLAB_OR_PRODUCT: "Your Product"
    TALENT_TYPE: "Your Talent"
    PRIMARY_PLATFORM: "TikTok"
    VIBE: "Premium street-lux"
    GOAL: "Product launch"
  `,
  systemPrompt: recipeTemplate,
  isClientFacing: true,
  maxBudget: 0.02,
});
```

### Method 2: Template System (Recommended)

```typescript
import { generateFromTemplate } from '@/lib/ai/integration';

const campaign = await generateFromTemplate(
  'try-on-react-campaign',
  `
    BRAND_NAME: "Your Brand"
    COLLAB_OR_PRODUCT: "Your Product"
    ...
  `
);
```

### Method 3: API Endpoint (Production)

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": "try-on-react-campaign",
    "variables": {
      "BRAND_NAME": "Your Brand",
      "COLLAB_OR_PRODUCT": "Your Product",
      "TALENT_TYPE": "Staff",
      "PRIMARY_PLATFORM": "TikTok",
      "VIBE": "Premium street-lux",
      "GOAL": "Product launch"
    }
  }'
```

## Recipe Metadata

Each recipe includes:

```yaml
---
recipe_id: try-on-react-campaign
category: campaigns/video
complexity: 0.85-0.95
recommended_model: claude
estimated_cost: $0.015-0.020
estimated_tokens: 1000 input, 800 output
cache_duration: 24h
version: 1.0
created: 2025-11-15
---
```

## Cost Optimization

Recipes are optimized for cost:
- **Simple recipes** (0.0-0.4 complexity) → Mistral ($0.0001)
- **Moderate recipes** (0.5-0.7 complexity) → Mistral + DeepSeek ($0.0003)
- **Complex recipes** (0.8+ complexity) → Claude ($0.015)
- **Final deliverables** → GPT-5 ($0.030)

Most creative recipes use **Claude** for quality, but generate **once** and reuse via caching.

## Caching Strategy

Recipes with similar inputs are cached:
- **Cache key:** `recipe-{id}-{hash(variables)}`
- **TTL:** 24 hours
- **Savings:** Up to 100% on repeated generations

Example:
```typescript
// First generation: $0.018
const campaign1 = await generateFromTemplate('try-on-react-campaign', vars1);

// Similar variables within 24h: $0 (cached)
const campaign2 = await generateFromTemplate('try-on-react-campaign', vars1);
```

## Creating New Recipes

### Recipe Template

```markdown
# [RECIPE NAME]
### [Category]
### Version 1.0

[Clear instructions for the AI]

---

## INPUT VARIABLES
- {{VARIABLE_1}}: Description
- {{VARIABLE_2}}: Description

---

## OUTPUT STRUCTURE
[Expected format]

---

## AI ROUTER CONFIGURATION
```typescript
{
  type: 'generation',
  complexity: 0.X,
  model: 'mistral|deepseek|claude|gpt-5',
  maxBudget: 0.XX,
}
```

---

## USAGE EXAMPLE
[Code example]

---

## EXPECTED OUTPUT
[Sample output]
```

### Testing New Recipes

```typescript
import { testRecipe } from '@/lib/ai/recipes';

// Test with sample data
const result = await testRecipe('your-new-recipe', {
  VARIABLE_1: 'Test value',
  VARIABLE_2: 'Test value',
});

console.log('Cost:', result.actualCost);
console.log('Quality:', result.qualityScore);
console.log('Time:', result.generationTime);
```

## Recipe Library

### Current Recipes (v1.0)

1. **try_on_react_campaign** - Video campaign for product launches
   - Complexity: High (0.85-0.95)
   - Model: Claude
   - Cost: $0.015-0.020
   - Use: Product drops, collab announcements

More recipes coming soon...

## Best Practices

### 1. Variable Naming
- Use `{{UPPERCASE_WITH_UNDERSCORES}}`
- Keep names descriptive
- Provide default values in comments

### 2. Prompt Engineering
- Be specific about output format
- Include examples where helpful
- Set clear constraints (length, tone, structure)

### 3. Cost Management
- Set `maxBudget` appropriately
- Use caching for similar requests
- Test with Mistral first, upgrade if needed

### 4. Quality Control
- Include "RULES" section with what to avoid
- Specify tone and voice clearly
- Provide output structure template

### 5. Versioning
- Update version number on changes
- Document changes in VERSION HISTORY
- Keep old versions for reference

## Monitoring

Track recipe performance:

```typescript
import { getRecipeStats } from '@/lib/ai/recipes';

const stats = await getRecipeStats('try-on-react-campaign', {
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30'),
});

console.log(`
  Uses: ${stats.totalUses}
  Avg Cost: $${stats.avgCost}
  Cache Rate: ${stats.cacheHitRate}%
  Avg Quality: ${stats.avgQualityScore}/5
`);
```

## Contributing

To add a new recipe:
1. Create markdown file in appropriate category
2. Follow recipe template structure
3. Test with AI Router
4. Document in this README
5. Submit PR with cost/quality benchmarks

## Support

For recipe issues or requests:
- Check `/apps/synqra-mvp/lib/ai/README.md` for AI Router docs
- Review existing recipes for examples
- Test in staging before production

---

**Synqra Content Recipes v1.0**  
Last Updated: 2025-11-15  
Compatible with: AI Router v1.0
