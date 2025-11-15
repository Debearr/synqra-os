# 📸 Thumbnail Engine MCP

**Platform-optimized thumbnail generation with brand DNA validation**

---

## 🎯 Purpose

Generate thumbnail blueprints (JSON specifications) for various platforms (YouTube, Instagram, TikTok, etc.) that:
- Match platform requirements (dimensions, file size, aspect ratio)
- Align with brand DNA (Synqra/NØID/AuraFX/De Bear)
- Optimize for visual impact and CTR
- Provide structured layout guides for designers or rendering engines

---

## 🚀 Quick Start

```typescript
import { thumbnailEngine } from '@mcp/thumbnail-engine';

const response = await thumbnailEngine.generate({
  platform: 'youtube',
  brand: 'synqra',
  title: 'AI Automation Revolution 2025',
  style: 'bold',
});

if (response.success) {
  const blueprint = response.data;
  console.log(blueprint);
}
```

---

## 📋 API Reference

### `generate(request: ThumbnailRequest): Promise<MCPResponse<ThumbnailBlueprint>>`

Generate a thumbnail blueprint.

**Parameters:**
- `platform`: Platform type (`'youtube'`, `'instagram'`, `'tiktok'`, etc.)
- `brand`: Brand identifier (`'synqra'`, `'noid'`, `'aurafx'`, `'de-bear'`)
- `title`: Title text to display
- `style` (optional): Visual style (`'minimal'`, `'bold'`, `'elegant'`, `'playful'`)
- `colors` (optional): Custom color array
- `includeText` (optional): Include text elements
- `customElements` (optional): Additional elements

**Returns:**
```typescript
{
  success: true,
  data: {
    platform: 'youtube',
    dimensions: { width: 1280, height: 720, aspectRatio: '16:9' },
    layout: {
      type: 'split',
      zones: [...]
    },
    colors: { primary: '#D4AF37', ... },
    typography: { titleFont: 'Inter Bold', ... },
    brandElements: { logo: true, ... },
    metadata: { id: 'thumb-...', ... }
  }
}
```

### `validate(file: Buffer, platform: Platform): Promise<MCPResponse<ValidationResult>>`

Validate a thumbnail file against platform specs.

---

## 🎨 Supported Platforms

| Platform | Dimensions | Aspect Ratio | Max Size |
|----------|-----------|--------------|----------|
| YouTube | 1280×720 | 16:9 | 2MB |
| Instagram | 1080×1080 | 1:1 | 8MB |
| TikTok | 1080×1920 | 9:16 | 10MB |
| Facebook | 1200×630 | 1.91:1 | 8MB |
| Twitter/X | 1200×675 | 16:9 | 5MB |
| LinkedIn | 1200×627 | 1.91:1 | 5MB |

---

## 🎭 Visual Styles

### Minimal
- Clean, centered layout
- Minimal text
- Maximum white space
- Focus on one key element

### Bold
- Split layout (image + text)
- High contrast
- Large, impactful typography
- Strong brand colors

### Elegant
- Rule of thirds composition
- Refined typography
- Sophisticated color palette
- Balanced elements

### Playful
- Hero background
- Dynamic positioning
- Vibrant colors
- Engaging visual flow

---

## 🧬 Brand DNA Integration

Each brand has defined characteristics:

**Synqra:**
- Tone: Confident and innovative
- Colors: Gold (#D4AF37), Midnight (#0A0E27), Platinum (#E5E4E2)
- Keywords: Creative, premium, intelligent, automation

**NØID:**
- Tone: Direct and supportive
- Colors: Success Green (#10B981), Obsidian (#1A1D2E), Silver (#C0C0C0)
- Keywords: Efficient, reliable, professional, driver

**AuraFX:**
- Tone: Authoritative and measured
- Colors: Info Blue (#3B82F6), Midnight (#0A0E27), Platinum (#E5E4E2)
- Keywords: Precise, analytical, disciplined, trading

---

## 📊 Blueprint Structure

```typescript
{
  // Platform specs
  platform: 'youtube',
  dimensions: { width: 1280, height: 720, aspectRatio: '16:9' },
  
  // Layout composition
  layout: {
    type: 'split',
    zones: [
      {
        id: 'hero-image',
        type: 'image',
        position: { x: 0, y: 0, width: 640, height: 720 },
      },
      {
        id: 'title',
        type: 'text',
        position: { x: 704, y: 216, width: 512, height: 288 },
        content: 'Your Title Here',
        style: { align: 'left', weight: 'bold' },
      },
      ...
    ]
  },
  
  // Color scheme
  colors: {
    primary: '#D4AF37',
    secondary: '#0A0E27',
    accent: '#E5E4E2',
    background: '#0A0E27',
    text: '#FFFFFF',
  },
  
  // Typography
  typography: {
    titleFont: 'Inter Bold',
    titleSize: 72,
    subtitleFont: 'Inter Regular',
    subtitleSize: 36,
  },
  
  // Brand elements
  brandElements: {
    logo: true,
    logoPosition: 'top-right',
    watermark: true,
  }
}
```

---

## 🧪 Testing

```bash
npm test
```

Test cases:
- ✅ Generate blueprint for each platform
- ✅ Validate brand DNA integration
- ✅ Check dimension accuracy
- ✅ Verify layout zones
- ✅ Test file validation

---

## 🔧 Configuration

Environment variables:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

Optional:
```bash
OPENAI_API_KEY=sk-...  # For AI-enhanced thumbnails
```

---

## 💡 Examples

### YouTube Tutorial Thumbnail
```typescript
const response = await thumbnailEngine.generate({
  platform: 'youtube',
  brand: 'synqra',
  title: 'Master AI Automation in 10 Minutes',
  style: 'bold',
});
```

### Instagram Post
```typescript
const response = await thumbnailEngine.generate({
  platform: 'instagram',
  brand: 'noid',
  title: 'Driver Tips: Maximize Earnings',
  style: 'minimal',
});
```

### TikTok Video Cover
```typescript
const response = await thumbnailEngine.generate({
  platform: 'tiktok',
  brand: 'aurafx',
  title: 'Day Trading Strategy Revealed',
  style: 'playful',
});
```

---

## 🚨 Error Handling

All errors are wrapped in MCPResponse format:
```typescript
{
  success: false,
  error: 'Error message here',
  metadata: { timestamp: '...', mcpTool: 'thumbnail-engine', duration: 123 }
}
```

---

## 📈 Metadata Storage

Thumbnails are automatically logged to Supabase:
- Table: `thumbnail_metadata`
- Includes: ID, platform, brand, full blueprint, timestamp
- Used for analytics and optimization

---

## 🔗 Related Tools

- `title-generator` - Generate A/B test titles
- `brand-style-check` - Validate brand consistency
- `asset-validator` - Validate final rendered images

---

**Version:** 1.0.0  
**Status:** ✅ Production-Ready  
**Maintainer:** NØID Labs Engineering
