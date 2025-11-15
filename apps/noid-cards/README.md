<div align="center">

# NØID Digital Cards

Luxury-grade digital credential system powering [`noidlux.com`](https://noidlux.com/card/debear).

</div>

## Architecture

- **Framework**: Next.js App Router · React 19
- **Styling**: Tailwind CSS v4 core with bespoke `luxgrid` tokens
- **Data**: Static JSON content + seasonal configuration (`src/content/cards`, `src/config/...`)
- **Automations**: QR generation + vCard export via edge-ready API routes

## Quickstart

```bash
git clone <repo>
cd noid-digital-cards
chmod +x setup-noid-cards.sh
./setup-noid-cards.sh
```

The script installs dependencies, lints, performs type-checking, builds the production bundle, and verifies all required card handles (`debear`, `andre`, `swapnil`, `josh`, `mustafa`).

Run the local preview:

```bash
npm run dev
```

## Deployment

1. Authenticate with Vercel and link the project (`vercel link`).
2. Pull environment settings if needed (`vercel pull`).
3. Deploy to production:

   ```bash
   vercel --prod
   ```

The provided `vercel.json` includes rewrites for `/card/:handle` and API aliases to ensure QR + vCard endpoints resolve instantly.

## Project Highlights

- Seasonal theming via `src/config/seasonalConfig.json` and `src/lib/seasonalLogic.ts`
- Design tokens + copy spec: `src/styles/luxgrid.*`
- QR + vCard automations: `src/app/api/card/[handle]/qr`, `src/app/api/card/[handle]/vcard`
- Digital card component: `src/components/card/DigitalCard.tsx`

## Directory Map

```
src/
  app/
    card/[handle]/page.tsx    # SSG per-handle card pages
    api/card/[handle]/...     # QR + vCard exports
  components/card/            # UI for digital credential
  config/                     # Fallback + seasonal config
  content/cards/              # Profile JSON payloads
  lib/                        # Tokens, registry, seasonal logic
  styles/                     # LuxGrid token specs
```

## Verification Checklist

- `/card/{debear|andre|swapnil|josh|mustafa}` render without hydration warnings
- QR + vCard endpoints respond within <200ms on Vercel Edge
- Lighthouse (Performance, Accessibility, Best Practices, SEO) ≥ 90 on production domain

## License

© 2025 NØID Labs. All rights reserved. Internal distribution only.
