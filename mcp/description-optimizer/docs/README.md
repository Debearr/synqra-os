# 📝 Description Optimizer MCP

**SEO-optimized YouTube descriptions with A/B testing**

---

## 🎯 Purpose

Generate description variants optimized for:
- SEO (keyword density, natural integration)
- User engagement (hooks, structure, readability)
- Platform best practices (YouTube, LinkedIn, Facebook)
- A/B testing (multiple strategic approaches)

---

## 🚀 Quick Start

```typescript
import { descriptionOptimizer } from '@mcp/description-optimizer';

const response = await descriptionOptimizer.generate({
  topic: 'AI Automation',
  keywords: ['machine learning', 'productivity', 'workflow'],
  cta: '👉 Subscribe for more AI tutorials!',
  variantCount: 3,
});
```

---

## 📋 API Reference

### `generate(request: DescriptionRequest): Promise<MCPResponse<DescriptionVariant[]>>`

**Parameters:**
- `topic` (required): Main topic
- `keywords` (optional): SEO keywords array
- `cta` (optional): Call-to-action
- `includeTimestamps` (optional): Add timestamp section
- `includeLinks` (optional): Add links section
- `maxLength` (optional): Max character limit (default: 5000)
- `variantCount` (optional): Number of variants (default: 3)
- `platform` (optional): Target platform (default: 'youtube')

---

## 🎨 Variant Strategies

### Variant A: SEO-Optimized
- **Focus:** Maximum keyword density
- **Structure:** Comprehensive overview + key topics + hashtags
- **SEO Score:** 0.95
- **Use Case:** Search visibility, discoverability

### Variant B: Bullet Points
- **Focus:** Scannability and quick info
- **Structure:** Quick overview + bullet lists + timestamps
- **SEO Score:** 0.75
- **Use Case:** Mobile users, quick readers

### Variant C: Storytelling
- **Focus:** Engagement and narrative
- **Structure:** Hook + story flow + emotional connection
- **SEO Score:** 0.65
- **Use Case:** Brand building, retention

---

## 💡 Examples

### YouTube Tutorial
```typescript
const response = await descriptionOptimizer.generate({
  topic: 'Master Python in 30 Days',
  keywords: ['python', 'programming', 'tutorial', 'beginners'],
  cta: '🔔 Subscribe and hit the bell!',
  includeTimestamps: true,
});
```

### LinkedIn Post
```typescript
const response = await descriptionOptimizer.generate({
  topic: 'Future of Remote Work',
  keywords: ['remote work', 'productivity', 'leadership'],
  platform: 'linkedin',
  maxLength: 1300,
});
```

---

**Version:** 1.0.0  
**Status:** ✅ Production-Ready
