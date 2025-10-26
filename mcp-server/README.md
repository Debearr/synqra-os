# Synqra MCP Server

**Model Context Protocol (MCP)** backend for the Synqra AI ecosystem, orchestrating Claude, GPT-5, and Leonardo AI for automated content generation and distribution.

---

## Features

- **AI Council Router**: Intelligent routing between Claude (creative) and GPT-5 (technical)
- **Multi-Model Integration**: Leonardo AI (images), Claude (captions), GPT-5 (complex content)
- **Supabase Logging**: Full observability via ai_logs, posts, and metrics tables
- **N8N Integration**: Webhook-based automation for LinkedIn posting
- **Railway-Ready**: Optimized for Railway deployment with health checks

---

## API Endpoints

### Health Check
```bash
GET /api/health
GET /api/health?checkDb=true  # Include Supabase connectivity test
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-26T12:00:00Z",
  "uptime": 3600,
  "environment": "production",
  "service": "MCP Server"
}
```

---

### Generate Image (Leonardo AI)
```bash
POST /api/generate-image
Content-Type: application/json

{
  "prompt": "Luxury minimalist product shot",
  "style": "CINEMATIC"
}
```

**Response:**
```json
{
  "generationId": "abc-123",
  "url": "https://cdn.leonardo.ai/image.jpg"
}
```

---

### Generate Caption (AI Council)
```bash
POST /api/generate-caption
Content-Type: application/json

{
  "imageUrl": "https://cdn.leonardo.ai/image.jpg",
  "context": "New product launch for luxury brand",
  "platform": "linkedin"
}
```

**Response:**
```json
{
  "caption": "Redefining luxury in the digital age...",
  "model_used": "claude"
}
```

**AI Council Routing:**
- **Claude 3.5 Sonnet** → Standard creative content (<500 chars)
- **GPT-5 Turbo** → Technical/complex content (>500 chars or "technical" keyword)

---

### Post to LinkedIn
```bash
POST /api/post-linkedin
Content-Type: application/json

{
  "text": "Check out our latest creation!",
  "imageUrl": "https://cdn.leonardo.ai/image.jpg",
  "authorId": "user-123"
}
```

**Response:**
```json
{
  "message": "Post queued successfully",
  "queued_at": "2025-10-26T12:00:00Z"
}
```

---

### Metrics
```bash
GET /api/metrics
```

**Response:**
```json
{
  "metrics": [
    {
      "id": 1,
      "action": "generate-image",
      "count": 42,
      "created_at": "2025-10-26"
    }
  ]
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key

# AI APIs
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
LEONARDO_API_KEY=your-leonardo-key
LEONARDO_MODEL_ID=b24e16ff-06e3-43eb-8d33-4416c2d75876

# N8N Webhooks
N8N_LINKEDIN_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/linkedin-post

# Optional
ALERT_WEBHOOK_URL=https://your-alert-service.com/webhook
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (with auto-reload)
npm run dev

# Start production server
npm start
```

Server runs on `http://localhost:3001`

---

## Railway Deployment

### Prerequisites
1. Railway account with CLI installed
2. Railway project created
3. Environment variables configured in Railway dashboard

### Deploy
```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

### CI/CD with GitHub Actions
The `.github/workflows/mcp-deploy.yml` workflow automatically deploys on push to `main` branch.

**Required GitHub Secrets:**
- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_PROJECT_ID` - Your Railway project ID
- `RAILWAY_ENVIRONMENT` - Target environment (e.g., "production")
- `RAILWAY_SERVICE_URL` - Your Railway service URL (for health checks)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE` - Supabase service role key
- `ALERT_WEBHOOK_URL` (optional) - Alert webhook for failures

---

## Health Check Strategy

### During CI (GitHub Actions)
- ✅ **NO Supabase ping** - Avoids GitHub IP restrictions
- ✅ Tests run against local mock
- ✅ Verifies server.js and config files exist

### Post-Deployment (Railway)
- ✅ Calls `/api/health` endpoint on Railway URL
- ✅ Retry logic with exponential backoff (5 attempts)
- ✅ Optional database connectivity check (`?checkDb=true`)
- ✅ Logs success/failure to Supabase

---

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│   MCP Server        │
│  (Railway/Railway)  │
├─────────────────────┤
│  AI Council Router  │
│  ├─ Claude API      │
│  ├─ GPT-5 API       │
│  └─ Leonardo AI     │
└──────┬──────┬───────┘
       │      │
       v      v
  ┌────────┐ ┌────────┐
  │Supabase│ │  N8N   │
  │ Logs   │ │AutoPost│
  └────────┘ └────────┘
```

---

## Optimization Roadmap

See [OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md) for detailed analysis.

**Quick Wins:**
- Reduce DB writes from 3→1 per request
- Add AI Council fallback logic
- Implement session-based context sharing

---

## Troubleshooting

### Health check fails during deployment
- Verify `RAILWAY_SERVICE_URL` secret is set correctly
- Check Railway logs: `railway logs`
- Ensure PORT environment variable is set (Railway auto-assigns)

### Supabase connection errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` are correct
- Check Supabase project isn't paused (free tier auto-pauses after 1 week inactivity)
- Confirm tables exist: `users`, `posts`, `ai_logs`, `metrics`, `health_pulse`

### AI API errors
- Verify API keys are valid and have sufficient credits
- Check rate limits (Claude: 50 req/min, GPT-5: varies by tier)
- Review logs in Supabase `ai_logs` table for specific error messages

---

## License

MIT
