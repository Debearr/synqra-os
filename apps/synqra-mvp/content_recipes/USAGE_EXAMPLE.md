# Content Recipes - Usage Examples

## Quick Start

### 1. Generate a Try-On Campaign

```typescript
import { executeRecipe } from '@/lib/ai';

const campaign = await executeRecipe('try_on_react_campaign', {
  BRAND_NAME: 'Barça Premium Coffee',
  COLLAB_OR_PRODUCT: 'FC Barcelona × AMIRI Limited Edition Barista Aprons',
  TALENT_TYPE: 'In-house baristas + 2-3 regular customers',
  PRIMARY_PLATFORM: 'TikTok + IG Reels',
  VIBE: 'Premium street-lux meets football culture, playful energy',
  GOAL: 'Product drop announcement + waitlist signups'
});

console.log(campaign.result);
// Cost: ~$0.018
// Time: ~3-5 seconds
```

### 2. List Available Recipes

```typescript
import { listRecipes } from '@/lib/ai';

const recipes = listRecipes();

recipes.forEach(recipe => {
  console.log(`
    ID: ${recipe.id}
    Name: ${recipe.name}
    Category: ${recipe.category}
    Complexity: ${recipe.complexity}
    Model: ${recipe.recommendedModel}
    Est. Cost: $${recipe.estimatedCost}
  `);
});
```

### 3. Search for Recipes

```typescript
import { searchRecipes } from '@/lib/ai';

// Find campaign-related recipes
const campaigns = searchRecipes('campaign');

// Find social media recipes
const social = searchRecipes('social');

// Find video-related recipes
const video = searchRecipes('video');
```

### 4. Test a Recipe

```typescript
import { testRecipe } from '@/lib/ai';

// Test with sample data
const result = await testRecipe('try_on_react_campaign', {
  BRAND_NAME: 'Test Brand',
  COLLAB_OR_PRODUCT: 'Test Product',
  TALENT_TYPE: 'Staff',
  PRIMARY_PLATFORM: 'TikTok',
  VIBE: 'Premium',
  GOAL: 'Test'
});

console.log('Generation time:', result.generationTime, 'ms');
console.log('Actual cost:', result.actualCost);
```

### 5. Get Recipe Stats

```typescript
import { getRecipeStats } from '@/lib/ai';

const stats = await getRecipeStats('try_on_react_campaign', {
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30'),
});

console.log(`
  Total uses: ${stats.totalUses}
  Average cost: $${stats.avgCost}
  Cache hit rate: ${stats.cacheHitRate}%
  Average quality: ${stats.avgQualityScore}/5
`);
```

## API Endpoint Usage

### Create API Route

```typescript
// app/api/recipes/route.ts
import { executeRecipe } from '@/lib/ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { recipeId, variables } = await req.json();
  
  try {
    const result = await executeRecipe(recipeId, variables);
    
    return NextResponse.json({
      success: true,
      data: result.result,
      cost: result.actualCost,
      time: result.generationTime,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
```

### Call from Frontend

```typescript
// Client-side usage
async function generateCampaign() {
  const response = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipeId: 'try_on_react_campaign',
      variables: {
        BRAND_NAME: 'Your Brand',
        COLLAB_OR_PRODUCT: 'Your Product',
        TALENT_TYPE: 'Staff',
        PRIMARY_PLATFORM: 'TikTok',
        VIBE: 'Premium',
        GOAL: 'Launch'
      }
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Campaign generated!');
    console.log('Cost:', data.cost);
    console.log('Time:', data.time, 'ms');
    console.log('Content:', data.data);
  }
}
```

## Real-World Examples

### Example 1: Barça Coffee × AMIRI Campaign

```typescript
const barcelonaCampaign = await executeRecipe('try_on_react_campaign', {
  BRAND_NAME: 'Barça Premium Coffee',
  COLLAB_OR_PRODUCT: 'FC Barcelona × AMIRI Limited Edition Barista Aprons',
  TALENT_TYPE: 'In-house baristas (mix of staff + 2 VIP customers)',
  PRIMARY_PLATFORM: 'TikTok (primary) + IG Reels (secondary)',
  VIBE: 'Barça × AMIRI energy: premium street-luxury meets football culture. Playful but elevated. Think: "We just dropped something insane."',
  GOAL: 'Product drop announcement + drive waitlist signups for limited apron drop (only 50 units)'
});

/*
Expected output:
- 35-second TikTok script with beats
- 15 shot list ideas
- 4 caption variations
- Cross-platform copy
- Brand guardrails

Cost: ~$0.018
Time: ~4 seconds
*/
```

### Example 2: Streetwear Brand × Athlete Collab

```typescript
const athleteCampaign = await executeRecipe('try_on_react_campaign', {
  BRAND_NAME: 'MVMT Street',
  COLLAB_OR_PRODUCT: 'Limited Edition Signature Sneakers with Local Basketball Star',
  TALENT_TYPE: 'Local basketball team + fans from the stands',
  PRIMARY_PLATFORM: 'Instagram Reels + YouTube Shorts',
  VIBE: 'Hype culture meets authentic community energy. Raw, energetic, real reactions.',
  GOAL: 'Product drop + in-store event RSVP'
});
```

### Example 3: Tech Product Launch

```typescript
const techLaunch = await executeRecipe('try_on_react_campaign', {
  BRAND_NAME: 'NØID Tech',
  COLLAB_OR_PRODUCT: 'NØID Driver OS - First Look Beta Program',
  TALENT_TYPE: 'Real gig drivers (Uber, DoorDash, Lyft)',
  PRIMARY_PLATFORM: 'YouTube Shorts + LinkedIn',
  VIBE: 'Premium tech reveal meets real-world testing. Professional but authentic. Show the "aha" moment when they see the earnings optimizer.',
  GOAL: 'Beta program signups + waitlist for public launch'
});
```

## Batch Processing

Generate multiple campaigns at once:

```typescript
import { executeRecipe } from '@/lib/ai';

const campaigns = await Promise.all([
  executeRecipe('try_on_react_campaign', varsA),
  executeRecipe('try_on_react_campaign', varsB),
  executeRecipe('try_on_react_campaign', varsC),
]);

console.log('Generated', campaigns.length, 'campaigns');
console.log('Total cost:', campaigns.reduce((sum, c) => sum + c.actualCost, 0));
```

## Caching Benefits

Same inputs within 24 hours = cached (free):

```typescript
// First call: $0.018 (Claude generation)
const campaign1 = await executeRecipe('try_on_react_campaign', vars);

// Same variables, 1 hour later: $0 (cached)
const campaign2 = await executeRecipe('try_on_react_campaign', vars);

// Slightly different variables: $0.018 (new generation)
const campaign3 = await executeRecipe('try_on_react_campaign', varsModified);
```

## Error Handling

```typescript
import { executeRecipe } from '@/lib/ai';

try {
  const campaign = await executeRecipe('try_on_react_campaign', variables);
  
  // Success
  console.log('Campaign generated successfully');
  return campaign.result;
  
} catch (error: any) {
  if (error.message.includes('Recipe not found')) {
    console.error('Invalid recipe ID');
  } else if (error.message.includes('budget')) {
    console.error('Cost exceeded budget');
  } else {
    console.error('Generation failed:', error.message);
  }
  
  // Fallback or retry logic
  return null;
}
```

## Custom Budget Control

```typescript
// Limit cost to $0.01 (will downgrade model if needed)
const campaign = await executeRecipe('try_on_react_campaign', variables, {
  maxBudget: 0.01,
});

// Force specific model
const campaign = await executeRecipe('try_on_react_campaign', variables, {
  model: 'mistral', // Try cheaper model first
});

// Custom cache key
const campaign = await executeRecipe('try_on_react_campaign', variables, {
  cacheKey: 'custom-key-for-testing',
});
```

## Integration with Existing Systems

### With Agent System

```typescript
import { wrapAgent } from '@/lib/ai/integration';
import { executeRecipe } from '@/lib/ai';

// Agent suggests using a recipe
const agentResponse = await optimizedAgent.invoke({
  message: 'I need a TikTok campaign for our new product'
});

if (agentResponse.answer.includes('try-on-react')) {
  // Agent recommended try-on-react recipe
  const campaign = await executeRecipe('try_on_react_campaign', {
    // Extract variables from conversation
    BRAND_NAME: 'Client Brand',
    // ...
  });
}
```

### With Content Calendar

```typescript
import { executeRecipe } from '@/lib/ai';

// Generate content for upcoming week
const contentCalendar = [
  { date: '2025-11-18', type: 'product-launch' },
  { date: '2025-11-20', type: 'behind-scenes' },
  { date: '2025-11-22', type: 'ugc-campaign' },
];

for (const item of contentCalendar) {
  const content = await executeRecipe(item.type, {
    // Dynamic variables based on calendar item
  });
  
  // Store in database
  await saveToContentCalendar(item.date, content);
}
```

## Performance Tips

1. **Use caching** - Reuse similar generations within 24h
2. **Batch requests** - Generate multiple at once
3. **Start with Mistral** - Test with cheaper model first
4. **Set budgets** - Prevent cost overruns
5. **Monitor usage** - Track with `getRecipeStats()`

## Next Steps

- Explore other recipes in `/content_recipes/`
- Create custom recipes for your brand
- Monitor costs with AI Router dashboard
- Share successful recipes with team

---

**Questions?** See `/content_recipes/README.md` for full documentation.
