# 🚀 BLOCK 1 — TurboRepo Monorepo Design

## 📊 Current State Analysis

### Existing Applications
1. **Synqra MVP** (`apps/synqra-mvp/`)
   - Next.js 15.0.2, React 18.3.1
   - AI content generation and posting platform
   - Anthropic Claude integration
   - Multi-platform posting (LinkedIn, X, TikTok, Instagram, YouTube)
   - AI agent system (Sales, Support, Service agents)
   - RAG system with retrieval
   - Safety guardrails
   - Supabase integration

2. **NØID Dashboard** (`noid-dashboard/`)
   - Next.js 16.0.0, React 19.2.0
   - Subscription/pricing management
   - Stripe integration
   - Dashboard analytics
   - Supabase integration

3. **NØID Digital Cards** (`noid-digital-cards/`)
   - Next.js 16.0.1, React 19.2.0
   - QR code generation
   - Digital card system

4. **AuraFX / LuxGrid** (Integrated)
   - Design system with LuxGrid color palette
   - Component library (Barcode, Card, CTA, Signature, etc.)
   - Currently embedded in Synqra MVP

### Shared Code Patterns Identified
- **Supabase clients** (both anon and admin)
- **AI agent infrastructure** (base classes, config, routing)
- **Content generation logic**
- **Posting pipeline** (multi-platform)
- **LuxGrid design system components**
- **Type definitions** (pricing, profiles, subscriptions)
- **Utility functions**

---

## 🎯 Proposed TurboRepo Structure

```
/workspace/
├── apps/
│   ├── synqra/                    # Main Synqra application (renamed from synqra-mvp)
│   ├── noid-dashboard/            # NØID Dashboard
│   ├── noid-cards/                # NØID Digital Cards
│   └── docs/                      # Documentation site (future)
│
├── packages/
│   ├── database/                  # Shared Supabase client & types
│   │   ├── src/
│   │   │   ├── client.ts         # Supabase client (anon)
│   │   │   ├── admin.ts          # Supabase admin client
│   │   │   ├── types/            # Database types
│   │   │   └── migrations/       # Shared migrations
│   │   └── package.json
│   │
│   ├── ai/                        # AI orchestration & agents
│   │   ├── src/
│   │   │   ├── agents/           # Base agent classes
│   │   │   ├── pipelines/        # AI workflow pipelines
│   │   │   ├── content/          # Content generation
│   │   │   ├── rag/              # RAG system
│   │   │   ├── safety/           # Guardrails
│   │   │   └── config/           # AI configuration
│   │   └── package.json
│   │
│   ├── posting/                   # Social media posting engine
│   │   ├── src/
│   │   │   ├── platforms/        # Platform integrations
│   │   │   │   ├── linkedin.ts
│   │   │   │   ├── x.ts
│   │   │   │   ├── tiktok.ts
│   │   │   │   ├── instagram.ts
│   │   │   │   └── youtube.ts
│   │   │   ├── queue/            # Background job queue
│   │   │   ├── router.ts         # Platform router
│   │   │   └── types/            # Posting types
│   │   └── package.json
│   │
│   ├── ui/                        # Shared UI components (AuraFX/LuxGrid)
│   │   ├── src/
│   │   │   ├── components/       # LuxGrid components
│   │   │   │   ├── Barcode.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── CTAButton.tsx
│   │   │   │   ├── Logo.tsx
│   │   │   │   └── ...
│   │   │   ├── colors/           # LuxGrid color system
│   │   │   ├── utils/            # UI utilities
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/                    # Shared configuration
│   │   ├── eslint/               # ESLint configs
│   │   ├── typescript/           # TypeScript configs
│   │   └── tailwind/             # Tailwind configs
│   │
│   └── utils/                     # Shared utilities
│       ├── src/
│       │   ├── media/            # Media optimization
│       │   ├── validation/       # Input validation
│       │   └── helpers/          # Common helpers
│       └── package.json
│
├── infra/                         # Infrastructure & deployment
│   ├── docs/
│   ├── workflows/
│   └── probes/
│
├── scripts/                       # Build & deployment scripts
│   └── health-checks/
│
├── turbo.json                     # TurboRepo configuration
├── package.json                   # Root workspace configuration
├── pnpm-workspace.yaml            # PNPM workspace config
└── README.md                      # Monorepo documentation
```

---

## 📦 Package Breakdown

### 1. `@noid/database`
**Purpose**: Unified Supabase client and database types  
**Exports**:
- `createClient()` - Anon Supabase client
- `createAdminClient()` - Admin Supabase client
- Type definitions: `ContentJob`, `ContentVariant`, `WaitlistEntry`, `ProfileRow`, etc.
- Database migration utilities

**Dependencies**:
- `@supabase/supabase-js`

---

### 2. `@noid/ai`
**Purpose**: AI orchestration, agents, and content generation  
**Exports**:
- `BaseAgent` class
- Specialized agents: `SalesAgent`, `SupportAgent`, `ServiceAgent`
- `ContentGenerator` - Multi-platform content generation
- `RAGSystem` - Retrieval-augmented generation
- `SafetyGuardrails` - Content moderation
- AI workflow pipelines (input → validation → processing → output)

**Dependencies**:
- `@anthropic-ai/sdk`
- `@noid/database`
- `zod` (validation)

---

### 3. `@noid/posting`
**Purpose**: Social media posting and background queue  
**Exports**:
- Platform clients: `LinkedInClient`, `XClient`, `TikTokClient`, etc.
- `PostingQueue` - Background job queue
- `PlatformRouter` - Route posts to appropriate platforms
- OAuth handlers

**Dependencies**:
- `@noid/database`
- Platform SDKs (when available)

---

### 4. `@noid/ui` (AuraFX/LuxGrid)
**Purpose**: Shared UI component library  
**Exports**:
- LuxGrid components (Barcode, Card, CTAButton, etc.)
- LuxGrid color system
- Common UI utilities

**Dependencies**:
- `react`
- `framer-motion`
- `lucide-react`
- `tailwind-merge`
- `class-variance-authority`

---

### 5. `@noid/utils`
**Purpose**: Shared utility functions  
**Exports**:
- Media optimization
- Input validation
- Common helpers

**Dependencies**: Minimal

---

### 6. `@noid/config`
**Purpose**: Shared configuration presets  
**Exports**:
- ESLint configurations
- TypeScript configurations
- Tailwind configurations

---

## 🔧 TurboRepo Configuration

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root package.json
```json
{
  "name": "noid-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.6.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

---

## 🎯 Migration Strategy

### Phase 1: Setup Infrastructure
1. Install TurboRepo and configure workspace
2. Create `packages/` directory structure
3. Set up shared TypeScript and ESLint configs

### Phase 2: Extract Shared Packages
1. **Create `@noid/database`**
   - Move `lib/supabaseClient.ts` → `packages/database/src/client.ts`
   - Move `lib/supabaseAdmin.ts` → `packages/database/src/admin.ts`
   - Extract shared types

2. **Create `@noid/ai`**
   - Move `lib/agents/` → `packages/ai/src/agents/`
   - Move `lib/contentGenerator.ts` → `packages/ai/src/content/`
   - Move `lib/rag/` → `packages/ai/src/rag/`
   - Move `lib/safety/` → `packages/ai/src/safety/`

3. **Create `@noid/posting`**
   - Move `lib/posting/` → `packages/posting/src/`

4. **Create `@noid/ui`**
   - Move `components/luxgrid/` → `packages/ui/src/components/`
   - Move `lib/luxgrid/` → `packages/ui/src/colors/`

5. **Create `@noid/utils`**
   - Move `lib/media/` → `packages/utils/src/media/`

### Phase 3: Update Apps
1. Update imports in `apps/synqra/` to use workspace packages
2. Update imports in `apps/noid-dashboard/` to use workspace packages
3. Update imports in `apps/noid-cards/` to use workspace packages

### Phase 4: Verification
1. Run TypeScript checks across all packages
2. Run lint across all packages
3. Test build process for all apps
4. Verify dev mode works for all apps

---

## ✅ Success Criteria

- [ ] All apps build successfully
- [ ] Zero TypeScript errors
- [ ] All imports use `@noid/*` workspace packages
- [ ] Dev mode works for all apps simultaneously
- [ ] No code duplication between apps
- [ ] Shared packages are properly versioned
- [ ] TurboRepo caching works correctly
- [ ] Documentation is updated

---

## 📊 Expected Benefits

1. **3x Faster Development**: Shared packages eliminate duplication
2. **Type Safety**: Centralized types across all apps
3. **Instant Refactoring**: Change once, update everywhere
4. **Better Testing**: Test shared packages independently
5. **Easier Onboarding**: Clear package boundaries
6. **Optimized Builds**: TurboRepo's intelligent caching
7. **Scalability**: Easy to add new apps/packages

---

## 🚨 Critical Rules

1. ✅ No breaking changes to existing business logic
2. ✅ Maintain full backward compatibility during migration
3. ✅ Keep DeepSeek-optimized AI stack intact
4. ✅ Preserve cost-efficient local models
5. ✅ All changes must pass TypeScript checks
6. ✅ No changes to environment variables or deployment config (yet)
7. ✅ Maintain Railway deployment compatibility

---

**Next Steps**: Begin Phase 1 implementation
