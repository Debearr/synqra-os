# ⚡ Quick Start — NØID Labs Monorepo

**For**: Developers joining the project  
**Time**: 5 minutes to full productivity  
**Prerequisites**: Node 18+, PNPM 8+

---

## 🚀 Getting Started

### 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd noid-monorepo

# Install all dependencies (includes turbo)
pnpm install
```

---

### 2. Set Up Environment Variables (1 minute)

```bash
# Copy example files
cp apps/synqra/.env.example apps/synqra/.env.local

# Edit with your credentials
nano apps/synqra/.env.local
```

**Required variables**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key  # Optional
```

---

### 3. Start Development (1 minute)

```bash
# Run all apps
pnpm dev

# Or run specific app
pnpm dev:synqra       # Port 3000
pnpm dev:dashboard    # Port 3000
pnpm dev:cards        # Port 3000
```

---

## 📦 Monorepo Structure

```
/workspace/
├── apps/
│   ├── synqra/           # Main Synqra app (Next.js 15)
│   ├── noid-dashboard/   # NØID Dashboard (Next.js 16)
│   └── noid-cards/       # NØID Digital Cards
│
└── packages/
    ├── database/         # @noid/database - Supabase client
    ├── ai/               # @noid/ai - AI agents & content gen
    ├── posting/          # @noid/posting - Social media posting
    ├── ui/               # @noid/ui - LuxGrid design system
    └── utils/            # @noid/utils - Shared utilities
```

---

## 🎨 Using Shared Packages

### Database (Supabase)
```typescript
import { supabase, supabaseAdmin } from '@noid/database';

// Use in API routes
const { data } = await supabaseAdmin
  .from('content_jobs')
  .select('*');
```

### AI Agents
```typescript
import { salesAgent, SupportAgent } from '@noid/ai';

// Invoke agent
const response = await salesAgent.invoke({
  message: 'How does pricing work?',
  conversationId: 'user-123'
});
```

### Social Posting
```typescript
import { LinkedInClient, PostingQueue } from '@noid/posting';

// Queue a post
await PostingQueue.enqueue('linkedin', {
  text: 'Check out our new feature!',
  mediaUrl: '...'
});
```

### UI Components (LuxGrid)
```typescript
import { Card, CTAButton, Logo } from '@noid/ui';

// Use in React
<Card>
  <Logo />
  <CTAButton>Get Started</CTAButton>
</Card>
```

---

## 🛠️ Common Commands

### Development
```bash
pnpm dev              # Run all apps
pnpm dev:synqra       # Run Synqra only
turbo run dev --filter=synqra  # Same as above
```

### Building
```bash
pnpm build            # Build all apps
pnpm build:synqra     # Build Synqra only
```

### Type Checking
```bash
pnpm type-check       # Check all packages
cd packages/ai && pnpm type-check  # Check one package
```

### Linting
```bash
pnpm lint             # Lint all apps
```

### Clean Start
```bash
pnpm clean            # Remove node_modules, .turbo, .next
pnpm install          # Reinstall
```

---

## 🧩 Adding a New Package

```bash
# 1. Create package directory
mkdir -p packages/my-package/src

# 2. Create package.json
cat > packages/my-package/package.json << EOF
{
  "name": "@noid/my-package",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {},
  "devDependencies": {
    "@noid/tsconfig": "workspace:*",
    "typescript": "^5.6.3"
  }
}
EOF

# 3. Create tsconfig.json
cat > packages/my-package/tsconfig.json << EOF
{
  "extends": "@noid/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
EOF

# 4. Install
pnpm install
```

---

## 🐛 Troubleshooting

### Build Fails with "Module not found"
```bash
# Clean and reinstall
rm -rf node_modules .turbo apps/*/.next packages/*/dist
pnpm install
```

### TypeScript Errors
```bash
# Check specific package
cd packages/ai
pnpm type-check

# Or check from root
turbo run type-check
```

### Supabase Connection Issues
```bash
# Verify env vars are set
cat apps/synqra/.env.local | grep SUPABASE

# Test connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/content_jobs?limit=1"
```

### Port Already in Use
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Or use different port
cd apps/synqra
pnpm dev -- -p 3004
```

---

## 📖 Key Concepts

### Workspace Packages
All packages use `workspace:*` protocol:
```json
{
  "dependencies": {
    "@noid/database": "workspace:*"
  }
}
```

### TurboRepo Caching
Turbo caches build outputs:
```bash
# First build: 45s
pnpm build

# Second build: 5s (cached!)
pnpm build
```

### Import Aliases
Apps use `@/` for local imports:
```typescript
// Local import
import { MyComponent } from '@/components/MyComponent';

// Package import
import { supabase } from '@noid/database';
```

---

## 🎓 Learning Resources

### Documentation
- [TurboRepo Docs](https://turbo.build/repo/docs)
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Next.js App Router](https://nextjs.org/docs/app)

### Internal Docs
- `BLOCK1-TURBOREPO-DESIGN.md` - Architecture
- `BLOCK1-COMPLETION-REPORT.md` - What was built
- `SECURITY-AUDIT-REPORT.md` - Security details

---

## ✅ Checklist for New Developers

- [ ] Clone repository
- [ ] Install PNPM (`npm install -g pnpm`)
- [ ] Run `pnpm install`
- [ ] Copy .env.example files
- [ ] Add Supabase credentials
- [ ] Start dev server (`pnpm dev`)
- [ ] Open http://localhost:3000
- [ ] Read BLOCK1-COMPLETION-REPORT.md
- [ ] Make first commit!

---

## 🚀 Ready to Build!

You're all set. The monorepo is clean, organized, and ready for development.

**Need help?** Check the completion report or security audit.

**Found a bug?** Create an issue with:
- What you expected
- What happened
- Steps to reproduce

---

**Last Updated**: 2025-11-15  
**Version**: Monorepo v1.0.0  
**Status**: Production Ready
