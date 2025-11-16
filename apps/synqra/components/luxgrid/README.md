# 🎨 LuxGrid UI Component Library v1.0

> First-generation component library for the SYNQRA × NØID ecosystem

## Design Philosophy

- **Tesla-grade minimalism** — No unnecessary elements
- **Tom Ford precision** — Every pixel matters
- **Virgil Abloh spacing** — Wide tracking, generous whitespace
- **Pure matte design** — No gradients, shadows, or noise

## Color System

All components use the LuxGrid color system from `/lib/luxgrid/colors.ts`:

- **Primary Black** (#000000) — Base background
- **Gold Accent** (#D4AF37) — Premium highlights
- **Emerald Accent** (#00D9A3) — Primary accent
- **Pure White** (#FFFFFF) — Text and borders

## Components

### 1. LuxGridLogo

Typography-based logo component for SYNQRA, NØID, and LUXGRID.

```tsx
import { LuxGridLogo } from '@/components/luxgrid';

<LuxGridLogo 
  variant="synqra"  // "synqra" | "noid" | "luxgrid"
  size="md"         // "sm" | "md" | "lg" | "xl"
  color="white"     // "white" | "gold" | "emerald" | "black"
/>
```

### 2. LuxGridBarcode

Signature barcode motif with programmatic SVG generation.

```tsx
import { LuxGridBarcode } from '@/components/luxgrid';

<LuxGridBarcode 
  width={240}
  height={32}
  accent="emerald"  // "gold" | "emerald"
/>
```

### 3. LuxGridSignature

"De Bear" signature mark with Virgil Abloh-style quotation marks.

```tsx
import { LuxGridSignature } from '@/components/luxgrid';

<LuxGridSignature 
  color="white"   // "white" | "gold" | "emerald" | "black"
  size="md"       // "sm" | "md" | "lg"
/>
```

### 4. LuxGridEndCard

Full-screen matte black end card for CapCut video exports.

```tsx
import { LuxGridEndCard } from '@/components/luxgrid';

<LuxGridEndCard 
  brand="synqra"              // "synqra" | "noid"
  tagline="Drive Unseen. Earn Smart."
  barcodeAccent="emerald"     // "gold" | "emerald"
/>
```

### 5. LuxGridDivider

Minimal horizontal divider with accent colors.

```tsx
import { LuxGridDivider } from '@/components/luxgrid';

<LuxGridDivider 
  color="emerald"      // "gold" | "emerald" | "white" | "black"
  thickness="medium"   // "thin" | "medium" | "thick"
  width="md"           // "sm" | "md" | "lg" | "full"
/>
```

### 6. LuxGridPageHeader

Consistent page header with title, subtitle, and divider.

```tsx
import { LuxGridPageHeader } from '@/components/luxgrid';

<LuxGridPageHeader 
  title="Page Title"
  subtitle="Optional subtitle text"
  dividerColor="emerald"
  textColor="white"
/>
```

### 7. LuxGridCTAButton

Premium call-to-action button with hover states.

```tsx
import { LuxGridCTAButton } from '@/components/luxgrid';

<LuxGridCTAButton 
  variant="primary"    // "primary" | "secondary" | "ghost"
  size="md"            // "sm" | "md" | "lg"
  fullWidth={false}
  onClick={() => {}}
>
  Get Started
</LuxGridCTAButton>
```

### 8. LuxGridTag

Minimal tag/label for categories and status indicators.

```tsx
import { LuxGridTag } from '@/components/luxgrid';

<LuxGridTag 
  variant="emerald"   // "gold" | "emerald" | "white" | "black"
  size="sm"           // "sm" | "md"
>
  NEW
</LuxGridTag>
```

### 9. LuxGridCard

Minimal content card with optional header and footer.

```tsx
import { LuxGridCard } from '@/components/luxgrid';

<LuxGridCard 
  variant="dark"      // "dark" | "light" | "outlined"
  padding="md"        // "sm" | "md" | "lg"
  header={<div>Header Content</div>}
  footer={<div>Footer Content</div>}
>
  Card body content
</LuxGridCard>
```

## Usage

### Import Individual Components

```tsx
import { 
  LuxGridLogo, 
  LuxGridBarcode,
  LuxGridCTAButton 
} from '@/components/luxgrid';
```

### Import Everything

```tsx
import * as LuxGrid from '@/components/luxgrid';

<LuxGrid.LuxGridLogo variant="synqra" size="lg" />
```

### Access Color System

```tsx
import { luxgridColors } from '@/components/luxgrid';

const goldHex = luxgridColors.goldAccent.hex;    // "#D4AF37"
const goldRGB = luxgridColors.goldAccent.rgb;    // "212, 175, 55"
```

## Responsive Design

All components are fully responsive:

- **Mobile-first** — Base styles optimized for mobile
- **Tailwind breakpoints** — sm, md, lg, xl, 2xl
- **Fluid typography** — Text scales smoothly across devices
- **Flexible layouts** — Grid and flex utilities adapt to viewport

## Testing

View the live component showcase:

```bash
cd /workspace/apps/synqra-mvp
npm install
npm run dev
```

Navigate to: `http://localhost:3000/luxgrid/components`

## Integration Examples

### CapCut End Card Export

```tsx
// Full-screen end card for video exports
<LuxGridEndCard 
  brand="synqra"
  tagline="Drive Unseen. Earn Smart."
  barcodeAccent="emerald"
/>
```

### Landing Page Header

```tsx
<div className="bg-lux-black min-h-screen">
  <LuxGridPageHeader 
    title="Welcome to SYNQRA"
    subtitle="AI-powered LinkedIn automation"
    dividerColor="emerald"
  />
  
  <div className="mt-12">
    <LuxGridCTAButton variant="primary" size="lg">
      Get Started
    </LuxGridCTAButton>
  </div>
</div>
```

### Product Card

```tsx
<LuxGridCard 
  variant="dark"
  padding="lg"
  header={
    <div className="flex justify-between items-center">
      <LuxGridLogo variant="noid" size="sm" color="gold" />
      <LuxGridTag variant="gold">PREMIUM</LuxGridTag>
    </div>
  }
  footer={
    <LuxGridCTAButton variant="ghost" size="sm">
      Learn More
    </LuxGridCTAButton>
  }
>
  <p>Your digital identity, redefined.</p>
</LuxGridCard>
```

## Design Compliance

✅ **No gradients** — Pure flat colors  
✅ **No shadows** — Matte surfaces only  
✅ **No animations** — Reserved for CapCut stage  
✅ **No external libraries** — Self-contained components  
✅ **Type-safe** — Full TypeScript support  
✅ **Mobile-first** — Responsive from 320px to 4K  

## File Structure

```
/components/luxgrid/
├── index.ts              # Barrel exports
├── Logo.tsx              # Logo component
├── Barcode.tsx           # Barcode component
├── Signature.tsx         # Signature component
├── EndCard.tsx           # EndCard component
├── Divider.tsx           # Divider component
├── PageHeader.tsx        # PageHeader component
├── CTAButton.tsx         # CTA Button component
├── Tag.tsx               # Tag component
├── Card.tsx              # Card component
├── ColorSwatch.tsx       # Color swatch (existing)
└── README.md             # This file
```

## Version History

**v1.0.0** (2025-11-11)
- Initial release
- 9 core UI primitives
- Full TypeScript support
- Mobile → 4K responsive
- Zero dependencies
- LuxGrid color system integration

## Future Roadmap

- **v1.1** — Animation variants for CapCut exports
- **v1.2** — Additional card layouts
- **v1.3** — Form components (Input, Select, Textarea)
- **v2.0** — Theme pack support (AuraFX, NY7 Coffee)

## License

Internal use only — SYNQRA × NØID ecosystem  
© 2025 LuxGrid OS

---

**Built with precision.**  
**Powered by LuxGrid.**
