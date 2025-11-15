# Synqra Multi-Agent Voice System - Runbook

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Deployment](#deployment)
4. [Configuration](#configuration)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring](#monitoring)

---

## Overview

The Synqra Multi-Agent Voice System is a complete AI-powered customer engagement platform with three specialized agents:

- **Sales Agent** - Lead qualification, product inquiries, demo scheduling
- **Support Agent** - Technical troubleshooting, issue resolution, debugging
- **Service Agent** - Account management, billing, feature requests

### Key Features

✅ **Dual Mode Operation**
- **Mock Mode**: No API calls, simulated responses (default)
- **Live Mode**: Real Claude API integration

✅ **Intelligent Routing**
- Automatic agent selection based on message content
- Manual agent selection via direct endpoints

✅ **RAG-Enhanced Responses**
- Knowledge base retrieval for accurate information
- Source attribution and confidence scoring

✅ **Safety Guardrails**
- Hallucination detection
- Dual-pass validation
- Content safety checks

✅ **Conversation Memory**
- Multi-turn conversation support
- Context-aware responses
- History tracking and management

---

## Architecture

### Directory Structure

```
apps/synqra-mvp/
├── app/
│   ├── agents/              # Agent dashboard UI
│   │   └── page.tsx
│   ├── api/
│   │   ├── agents/          # Agent API routes
│   │   │   ├── route.ts     # Auto-routing endpoint
│   │   │   ├── sales/       # Sales agent endpoint
│   │   │   ├── support/     # Support agent endpoint
│   │   │   └── service/     # Service agent endpoint
│   │   └── health/          # Health check for Railway
│   └── layout.tsx
├── lib/
│   ├── agents/              # Agent system core
│   │   ├── base/
│   │   │   ├── agent.ts     # BaseAgent class
│   │   │   ├── config.ts    # Configuration
│   │   │   └── types.ts     # Type definitions
│   │   ├── shared/
│   │   │   ├── memory.ts    # Conversation memory
│   │   │   ├── tools.ts     # Tool definitions
│   │   │   ├── router.ts    # Intelligent routing
│   │   │   └── personaPresets.ts
│   │   ├── sales/           # Sales agent
│   │   ├── support/         # Support agent
│   │   ├── service/         # Service agent
│   │   └── index.ts
│   ├── rag/                 # RAG retrieval system
│   │   ├── retrieval.ts
│   │   └── index.ts
│   └── safety/              # Safety guardrails
│       ├── guardrails.ts
│       └── index.ts
├── .env.example             # Example environment variables
├── .env.local               # Local development config
└── RUNBOOK.md              # This file
```

### Component Diagram

```
User Request
    ↓
[API Route] (/api/agents)
    ↓
[Router] (Intelligent routing)
    ↓
[Agent] (Sales/Support/Service)
    ↓
[RAG] (Knowledge retrieval)
    ↓
[Claude API] (if live mode)
    ↓
[Safety] (Guardrails validation)
    ↓
Response
```

---

## Deployment

### Railway Deployment

**Current Configuration:**
- Domain: `synqra.co`
- Railway Domain: `synqra-os-production.up.railway.app`
- Build Command: `npm --prefix apps/synqra-mvp run build`
- Start Command: `npm --prefix apps/synqra-mvp run start`
- Port: `8080` (binds to `0.0.0.0`)

**Health Check:**
- Endpoint: `GET /api/health`
- Expected Status: `200 OK`
- Response: JSON with system status

**DNS Configuration (Porkbun):**
```
ALIAS @ → synqra-os-production.up.railway.app
CNAME www → synqra-os-production.up.railway.app
```

### Build Process

```bash
# 1. Navigate to app directory
cd apps/synqra-mvp

# 2. Install dependencies
npm install

# 3. Build Next.js app
npm run build

# 4. Start production server
npm run start
```

### Environment Variables (Railway)

**Required for Live Mode:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
AGENT_MODE=live
```

**Optional:**
```bash
DEBUG_AGENTS=false
RAG_ENABLED=true
HALLUCINATION_CHECK=true
DUAL_PASS_VALIDATION=true
```

---

## Configuration

### Mode Switching

**Mock Mode (Default)**
- No API calls
- Instant responses
- Perfect for testing
- Set via: `AGENT_MODE=mock`

**Live Mode**
- Real Claude API calls
- Requires `ANTHROPIC_API_KEY`
- Set via: `AGENT_MODE=live`

### Agent Configuration

**Temperature Settings:**
- Sales: `0.7` (balanced)
- Support: `0.5` (more consistent)
- Service: `0.6` (slightly creative)

**Max Tokens:**
- Default: `4096`
- Override via: `AGENT_MAX_TOKENS=8192`

### RAG Configuration

**Knowledge Base:**
- Location: `lib/rag/retrieval.ts`
- Default Documents: 10 categories
- Similarity Threshold: `0.7`

**Categories:**
- pricing
- authentication
- integrations
- api
- trial
- billing
- team
- support
- data
- security

**To Add Documents:**
```typescript
import { addDocument } from '@/lib/rag';

await addDocument({
  content: "Your documentation content here",
  source: "/docs/your-page",
  category: "support",
  keywords: ["keyword1", "keyword2"]
});
```

---

## API Reference

### Health Check

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "services": {
    "agents": {
      "status": "healthy",
      "mode": "mock",
      "errors": []
    },
    "rag": {
      "status": "healthy",
      "documentsCount": 10,
      "categoriesCount": 10
    }
  },
  "version": "1.0.0"
}
```

### List Agents

```bash
GET /api/agents
```

**Response:**
```json
{
  "agents": [
    {
      "role": "sales",
      "name": "Synqra Sales Agent",
      "description": "...",
      "endpoint": "/api/agents/sales"
    },
    ...
  ],
  "mode": "mock",
  "ragEnabled": true,
  "safetyEnabled": true
}
```

### Auto-Routing Agent Invocation

```bash
POST /api/agents
Content-Type: application/json

{
  "message": "How much does Synqra cost?",
  "conversationId": "optional-conv-id",
  "context": {},
  "history": []
}
```

**Response:**
```json
{
  "agent": "sales",
  "routing": {
    "confidence": 0.95,
    "reason": "Sales or product inquiry detected"
  },
  "response": {
    "answer": "Great question about pricing!...",
    "confidence": 0.95,
    "sources": ["/pricing", "/docs/plans"],
    "reasoning": "Mock sales response..."
  },
  "safety": {
    "recommendation": "allow",
    "confidence": 0.9,
    "flags": []
  },
  "timestamp": "2025-11-09T..."
}
```

### Direct Agent Invocation

**Sales Agent:**
```bash
POST /api/agents/sales
```

**Support Agent:**
```bash
POST /api/agents/support
```

**Service Agent:**
```bash
POST /api/agents/service
```

All use the same request/response format as auto-routing.

---

## Troubleshooting

### Build Failures

**Problem: Font fetch errors**
```
Failed to fetch font `Inter` from Google Fonts
```

**Solution:**
Fonts have been switched to system fonts. If you see this error:
1. Check `app/layout.tsx` - should NOT import from `next/font/google`
2. Verify `tailwind.config.ts` uses system font stack
3. Rebuild: `npm run build`

**Problem: TypeScript errors on `z.record`**
```
Expected 2-3 arguments, but got 1
```

**Solution:**
Use `z.record(z.string(), z.any())` instead of `z.record(z.any())`

### Runtime Errors

**Problem: Anthropic API errors in live mode**
```
Error: Invalid API key
```

**Solution:**
1. Check `.env.local` has `ANTHROPIC_API_KEY=sk-ant-...`
2. Verify key starts with `sk-ant-api03-`
3. Switch to mock mode for testing: `AGENT_MODE=mock`

**Problem: Health check returns 503**

**Solution:**
1. Check Railway logs: `railway logs`
2. Verify all required env vars are set
3. Check `/api/health` response for specific errors

### Deployment Issues

**Problem: Railway deployment fails**

**Solution:**
1. Check build logs in Railway dashboard
2. Verify `railway.json` points to correct paths
3. Ensure `PORT` env var is set (Railway auto-sets)
4. Test build locally: `npm run build`

**Problem: App builds but returns 404**

**Solution:**
1. Verify Railway start command: `npm --prefix apps/synqra-mvp run start`
2. Check Next.js is binding to `0.0.0.0`, not `localhost`
3. Verify port is `${PORT:-3000}`

---

## Monitoring

### Health Checks

**Endpoint:** `/api/health`
**Frequency:** Check every 30 seconds
**Expected Response Time:** < 100ms

**Monitoring Setup (Example):**
```bash
# Simple health check script
curl -f https://synqra.co/api/health || echo "Health check failed!"
```

**UptimeRobot Configuration:**
- Monitor Type: HTTP(s)
- URL: `https://synqra.co/api/health`
- Interval: 5 minutes
- Alert Contacts: Your email

### Key Metrics

**Performance:**
- Mock mode response time: ~1.5s
- Live mode response time: ~3-5s (depends on Claude API)
- Health check: <100ms

**Availability:**
- Target: 99.9% uptime
- Health endpoint should always return 200 or 503

**Errors to Monitor:**
- 500 errors (agent invocation failures)
- 503 errors (service unavailable)
- 400 errors (validation failures)

### Logging

**Debug Mode:**
```bash
DEBUG_AGENTS=true
```

**Log Output:**
```
🤖 [Synqra Sales Agent] Invocation:
   mode: mock
   message: How much does...
   conversationId: test-123

🔀 Routing to sales agent (95% confidence)
   Reason: Sales or product inquiry detected
```

**Production Logging:**
- Set `DEBUG_AGENTS=false`
- Monitor Railway logs for errors
- Set up log aggregation (optional: Datadog, Logtail, etc.)

---

## Quick Reference

### Local Development

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Start production
npm run start

# Test health endpoint
curl http://localhost:3000/api/health

# Test agent endpoint
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"message": "How much does Synqra cost?"}'
```

### Testing Agents

**Dashboard UI:**
Visit: `https://synqra.co/agents`

**Example Queries:**

*Sales:*
- "How much does Synqra cost?"
- "I want to schedule a demo"
- "What features do you offer?"

*Support:*
- "I can't log in to my account"
- "The API is returning 401 errors"
- "The dashboard is loading slowly"

*Service:*
- "I want to upgrade my plan"
- "How do I cancel my subscription?"
- "Can you add a new feature for CSV export?"

### Switching Modes

**Mock to Live:**
1. Get Anthropic API key from console.anthropic.com
2. Update `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   AGENT_MODE=live
   ```
3. Restart server: `npm run dev`

**Live to Mock:**
1. Update `.env.local`:
   ```bash
   AGENT_MODE=mock
   ```
2. Restart server

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Debearr/synqra-os/issues
- Email: support@synqra.com
- Dashboard: https://synqra.co/agents

## Version History

- **v1.0.0** (2025-11-09): Initial release
  - Multi-agent system (Sales, Support, Service)
  - RAG retrieval with knowledge base
  - Safety guardrails
  - Mock + Live modes
  - Health check endpoint
  - Dashboard UI

---

## Next Steps

### Recommended Enhancements

1. **Voice Integration**
   - Add speech-to-text (Deepgram, AssemblyAI)
   - Add text-to-speech (ElevenLabs, PlayHT)
   - Implement audio streaming

2. **Advanced RAG**
   - Connect to vector database (Pinecone, Weaviate)
   - Implement semantic search
   - Add document embeddings

3. **Production Tooling**
   - Connect to real ticketing system (Zendesk, Intercom)
   - Integrate with CRM (Salesforce, HubSpot)
   - Add analytics dashboard

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Add performance monitoring (Vercel Analytics)
   - Implement usage analytics

5. **Testing**
   - Add unit tests (Jest, Vitest)
   - Add integration tests
   - Add E2E tests (Playwright)
