# 🏗️ System Architecture

**Version**: 1.0.0  
**Philosophy**: Tesla Minimalism × Apple Clarity × Tom Ford Precision  
**Status**: Production Standard

---

## 🎯 Core Principles

### 1. Scalable by Default
- Monorepo structure supports 100+ apps
- Shared packages eliminate duplication
- TurboRepo enables parallel builds
- Clear dependency graphs

### 2. Predictable & Repeatable
- Every operation is idempotent
- Same input → same output
- No hidden side effects
- Deterministic builds

### 3. Zero Clutter
- If it's not used, delete it
- No "just in case" code
- No commented-out blocks
- Clean git history

### 4. Fail Fast & Loud
- Errors should be obvious
- No silent failures
- Comprehensive error messages
- Self-healing when possible

---

## 📐 Monorepo Structure

```
/workspace/
├── apps/                    # Application layer
│   ├── synqra/             # Main Synqra app
│   ├── noid-dashboard/     # NØID Dashboard
│   ├── noid-cards/         # NØID Digital Cards
│   └── [future-apps]/      # Room to grow
│
├── packages/               # Shared packages
│   ├── database/           # @noid/database
│   ├── ai/                 # @noid/ai
│   ├── posting/            # @noid/posting
│   ├── ui/                 # @noid/ui
│   ├── utils/              # @noid/utils
│   ├── tsconfig/           # @noid/tsconfig
│   └── eslint/             # @noid/eslint-config
│
├── blueprint/              # Engineering standards
├── infra/                  # Infrastructure config
├── scripts/                # Build & deploy scripts
└── [config files]          # Root configs
```

---

## 🔄 Data Flow Architecture

### Request Flow (Synqra Example)

```
User → Next.js App Router → API Route → AI Routing Layer
                                            ↓
                              ┌─────────────┴─────────────┐
                              ↓                           ↓
                        Local Models              External APIs
                        (DeepSeek)                 (Claude)
                              ↓                           ↓
                              └─────────────┬─────────────┘
                                            ↓
                              Brand Alignment Check (OpenCLIP)
                                            ↓
                              Safety Guardrails
                                            ↓
                              Supabase Storage
                                            ↓
                              Response to User
```

### Package Dependencies

```
apps/synqra
├── @noid/database
├── @noid/ai
│   └── @noid/database
├── @noid/posting
│   └── @noid/database
├── @noid/ui
└── @noid/utils

apps/noid-dashboard
├── @noid/database
└── @noid/ui

apps/noid-cards
└── @noid/ui
```

**Rule**: Packages can depend on each other, but NO circular dependencies.

---

## 🧩 Package Design Patterns

### Single Responsibility

Each package has ONE job:

- `@noid/database` → Database access ONLY
- `@noid/ai` → AI/ML inference ONLY
- `@noid/posting` → Social posting ONLY
- `@noid/ui` → UI components ONLY
- `@noid/utils` → Pure utility functions ONLY

### Dependency Injection

```typescript
// ❌ Bad: Hard-coded dependency
import { supabase } from '@noid/database';

export function savePost(content: string) {
  return supabase.from('posts').insert({ content });
}

// ✅ Good: Injected dependency
import type { SupabaseClient } from '@supabase/supabase-js';

export function savePost(db: SupabaseClient, content: string) {
  return db.from('posts').insert({ content });
}
```

### Interface-First Design

```typescript
// Define interface first
export interface AIRouter {
  route(input: string): Promise<ModelChoice>;
  infer(input: string, model: string): Promise<string>;
  fallback(error: Error): Promise<string>;
}

// Then implement
export class ProductionAIRouter implements AIRouter {
  // Implementation
}

// Easy to test
export class MockAIRouter implements AIRouter {
  // Mock for tests
}
```

---

## 🔐 Security Architecture

### Defense in Depth

```
Layer 1: Edge Protection (Vercel/Railway)
    ├─ Rate limiting
    ├─ DDoS protection
    └─ SSL/TLS termination
    
Layer 2: Application (Next.js)
    ├─ Input validation
    ├─ CSRF protection
    └─ Authentication

Layer 3: API Routes
    ├─ Request validation (Zod)
    ├─ Authorization checks
    └─ Error sanitization

Layer 4: Business Logic
    ├─ Safety guardrails
    ├─ Brand alignment
    └─ Content moderation

Layer 5: Database (Supabase)
    ├─ RLS policies
    ├─ Encrypted at rest
    └─ Audit logging
```

### Secrets Management

```
Environment Variables (Railway/Vercel)
    ↓
Loaded at runtime (process.env)
    ↓
Never committed to git
    ↓
Graceful fallbacks for builds
```

---

## ⚡ Performance Architecture

### Build Optimization

```
TurboRepo Caching
    ├─ Local cache: ~/.turbo/cache
    ├─ Remote cache: Vercel (optional)
    └─ Smart invalidation

Cold Build: ~45s
Cached Build: ~15s (3x faster)
```

### Runtime Optimization

```
Next.js App Router
    ├─ Static pages: Pre-rendered
    ├─ Dynamic pages: ISR (Incremental Static Regeneration)
    ├─ API routes: Edge functions where possible
    └─ Client components: Code-split automatically

AI Models
    ├─ Lazy loading: Load on first use
    ├─ Quantization: 4-bit for local models
    ├─ Caching: Multi-layer (memory → Redis → DB)
    └─ Batching: Group similar requests
```

---

## 🧪 Testing Architecture

### Test Pyramid

```
         E2E Tests (5%)
         ↑ Critical user flows
         ↑ Full stack
    
    Integration Tests (25%)
    ↑ Package interactions
    ↑ API contracts
    
Unit Tests (70%)
↑ Pure functions
↑ Fast & isolated
```

### Test Strategy

```typescript
// Unit: Test pure logic
function calculateCost(tokens: number, model: string): number {
  // Pure calculation
}

// Integration: Test interactions
async function saveAndNotify(data: any) {
  await database.save(data);
  await notifications.send(data.userId);
}

// E2E: Test full flows
test('User can generate and publish content', async () => {
  await login();
  await generateContent('Test brief');
  await publish(['linkedin', 'x']);
  expect(await getPublishedPosts()).toHaveLength(2);
});
```

---

## 📊 Observability Architecture

### Logging Levels

```
ERROR:   Failures requiring immediate action
WARN:    Potential issues, degraded performance
INFO:    Normal operations, state changes
DEBUG:   Detailed flow for troubleshooting
```

### Structured Logging

```typescript
// ✅ Good: Structured JSON
logger.info({
  event: 'ai_inference',
  model: 'deepseek',
  latency_ms: 1234,
  cost_usd: 0.0001,
  cache_hit: false,
  timestamp: new Date().toISOString()
});

// ❌ Bad: Unstructured strings
console.log('AI inference took 1234ms with deepseek');
```

### Metrics to Track

```
Business Metrics:
├─ User signups
├─ Content generated
├─ Posts published
└─ Revenue

Technical Metrics:
├─ API response time (p50, p95, p99)
├─ Error rate
├─ Cache hit rate
└─ Build time

AI Metrics:
├─ Inference latency
├─ Model usage distribution
├─ Cost per inference
└─ Quality scores
```

---

## 🔄 Deployment Architecture

### Multi-Environment Strategy

```
Development (local)
├─ Mock data
├─ Local models
├─ Fast iteration
└─ No cost

Staging (Railway preview)
├─ Real Supabase (test DB)
├─ Real models
├─ Mirrors production
└─ Safe testing

Production (Railway main)
├─ Real users
├─ Real data
├─ Monitoring enabled
└─ Automatic rollback
```

### Zero-Downtime Deploys

```
1. Build new version
2. Health check passes
3. Route 10% traffic (canary)
4. Monitor for 5 minutes
5. If healthy → Route 100%
6. If unhealthy → Rollback
```

---

## 🎯 Non-Functional Requirements

### Performance
- API response time: <200ms (p95)
- AI inference: <2s local, <5s external
- Build time: <60s (cached)
- Page load: <1s (LCP)

### Reliability
- Uptime: 99.9% (8.76 hours downtime/year max)
- Error rate: <0.1%
- Recovery time: <5 minutes
- Data loss: Zero (backups every 1 hour)

### Scalability
- Support 10,000 concurrent users
- Handle 1M API requests/day
- Store 1TB of content
- Process 100K AI inferences/day

### Security
- Zero exposed secrets
- All data encrypted (at rest + in transit)
- Rate limiting: 100 req/min per user
- Regular security audits

---

## 🚀 Future Architecture Considerations

### Planned Enhancements

1. **Microservices** (if needed at scale)
   - Separate AI service
   - Separate posting service
   - API gateway

2. **Edge Computing**
   - Move simple AI to Cloudflare Workers
   - Reduce latency by 50%

3. **Real-time Features**
   - WebSocket support
   - Live collaboration
   - Instant updates

4. **Advanced Caching**
   - CDN for static assets
   - GraphQL for efficient queries
   - Service worker for offline

---

## ✅ Architecture Review Checklist

Before shipping new features:

- [ ] Follows monorepo structure
- [ ] Single responsibility per package
- [ ] No circular dependencies
- [ ] Proper error handling
- [ ] Logging implemented
- [ ] Tests written (70%+ coverage)
- [ ] Security reviewed
- [ ] Performance benchmarked
- [ ] Documentation updated

---

**Next**: See [coding-standards.md](./coding-standards.md) for implementation details.
