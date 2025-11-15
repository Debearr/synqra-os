# 🚀 SYNQRA MCP FLEET

**Complete Model Context Protocol Toolbox for Synqra / NØID / AuraFX Ecosystem**

---

## 📋 Overview

This directory contains 16 production-ready MCP tools that power the multi-agent AI system across:

- **Synqra** - Content automation & marketing
- **NØID** - Gig-driver automation ecosystem
- **AuraFX** - Trading intelligence & signals platform

---

## 🛠️ MCP Tools

| # | Tool | Purpose | Status |
|---|------|---------|--------|
| 1 | `thumbnail-engine` | Generate platform-optimized thumbnails | ✅ |
| 2 | `title-generator` | A/B test YouTube titles | ✅ |
| 3 | `description-optimizer` | SEO-optimized descriptions | ✅ |
| 4 | `sentiment-filter` | DistilBERT sentiment analysis | ✅ |
| 5 | `toxicity-guard` | RoBERTa toxicity detection | ✅ |
| 6 | `supabase-writer` | CRUD operations for Supabase | ✅ |
| 7 | `supabase-reader` | Vector search & analytics | ✅ |
| 8 | `multichannel-poster` | Post to IG/FB/X/TikTok/LinkedIn | ✅ |
| 9 | `ai-router` | Intelligent model routing | ✅ |
| 10 | `brand-style-check` | OpenCLIP brand validation | ✅ |
| 11 | `ocr-processor` | PaddleOCR/Donut text extraction | ✅ |
| 12 | `notification-sender` | Telegram alerts | ✅ |
| 13 | `scheduler` | Cron-like workflow execution | ✅ |
| 14 | `asset-validator` | Platform spec validation | ✅ |
| 15 | `youtube-uploader` | YouTube API upload | ✅ |
| 16 | `analytics-fetcher` | Platform analytics | ✅ |

---

## 🏗️ Architecture

### Folder Structure
```
mcp/
├── README.md                    # This file
├── shared/                      # Shared utilities
│   ├── types.ts
│   ├── config.ts
│   └── utils.ts
├── thumbnail-engine/
│   ├── package.json
│   ├── src/
│   │   └── index.ts
│   ├── tests/
│   │   └── index.test.ts
│   ├── docs/
│   │   └── README.md
│   └── mcp.json
├── title-generator/
│   └── ...
└── [14 more tools]
```

### Common Standards

Every MCP includes:
- ✅ `package.json` with dependencies
- ✅ `src/index.ts` as entry point
- ✅ `mcp.json` manifest
- ✅ `docs/README.md` documentation
- ✅ `tests/*.test.ts` unit tests
- ✅ Environment variable loader
- ✅ Retry + error handling
- ✅ Health check endpoint
- ✅ Logging
- ✅ Safe fallbacks

---

## 🔐 Environment Variables

Required variables (load via `.env`):
```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE
SUPABASE_ANON_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
DEEPSEEK_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
```

---

## 🚀 Quick Start

### Install All Tools
```bash
cd mcp
npm run install-all
```

### Run Tests
```bash
npm run test-all
```

### Start Individual MCP
```bash
cd thumbnail-engine
npm install
npm run dev
```

---

## 🧪 Testing

Each MCP includes:
1. **Unit tests** (Jest/Vitest)
2. **Integration tests**
3. **Health check**
4. **Dry run mode**
5. **Environment validation**
6. **Output schema validation**
7. **Safety layer tests**

---

## 🔄 Adding New MCP Tools

Follow the rinse-and-repeat rule:

1. Copy template from `shared/template/`
2. Update `package.json` name
3. Implement tool logic in `src/index.ts`
4. Add tests in `tests/`
5. Document in `docs/`
6. Run `npm test`
7. Add to main README

---

## 📊 Cost Optimization

All tools integrate with:
- Budget guardrails ($200/month limit)
- Local model routing (80% local, 20% API)
- Token usage tracking
- Cost reporting

---

## 🛡️ Safety Features

- ✅ Environment validation on startup
- ✅ Automatic retries with exponential backoff
- ✅ Graceful degradation
- ✅ Health monitoring
- ✅ Error logging to Supabase
- ✅ Telegram alerts for failures

---

## 📚 Documentation

Each tool has detailed docs in `[tool]/docs/README.md`:
- Purpose & use cases
- API reference
- Configuration options
- Examples
- Troubleshooting

---

## 🎯 Integration

### With Main App
```typescript
import { ThumbnailEngine } from '@mcp/thumbnail-engine';
import { TitleGenerator } from '@mcp/title-generator';

const thumbnail = await ThumbnailEngine.generate({
  platform: 'youtube',
  brand: 'synqra',
});

const title = await TitleGenerator.create({
  topic: 'AI automation',
  mode: 'seo',
});
```

### With AI Router
All tools automatically route through the intelligent AI Router:
- Simple queries → Llama 3.2 1B (local)
- Medium complexity → DeepSeek V3
- High complexity → Claude/GPT-4o

---

## 📈 Monitoring

Health endpoints available:
- `GET /health` - Individual MCP health
- `GET /metrics` - Usage statistics
- `GET /logs` - Recent activity

---

## 🔗 Related

- `/workspace/DEEPSEEK-UPGRADE-COMPLETE-REPORT.md`
- `/workspace/HUGGINGFACE-DEPLOYMENT-GUIDE.md`
- `/workspace/system/context_state.md`

---

**Generated:** 2025-11-15  
**Status:** ✅ Production-Ready  
**Maintainer:** NØID Labs Engineering

🚀 **SYNQRA MCP FLEET - COMPLETE AUTONOMOUS TOOLBOX** 🚀
