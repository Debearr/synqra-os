# Synqra MCP Orchestration Server

AI orchestration system for Synqra/NØID/AuraFX with intelligent routing, fallbacks, and automated social media posting.

## Features

- **AI Router**: Intelligent routing with automatic fallbacks across multiple AI services
- **Multi-Service Integration**:
  - Leonardo AI (image generation)
  - Claude (captions & content)
  - GPT-4O (logic & reasoning)
  - VOAI (video generation - placeholder)
- **LinkedIn Auto-posting**: Automated social media content distribution
- **Health Monitoring**: Real-time service health tracking with auto-recovery
- **Supabase Integration**: Comprehensive logging and data storage
- **Production-Ready**: Error handling, logging, and monitoring built-in

## Quick Start

### Local Development

```bash
cd mcp-server
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### Testing

```bash
npm test
```

### Production Deployment

The server is configured for Railway deployment with automatic health checks and restart policies.

## API Endpoints

### Health Check
```bash
GET /health
```

### Full Pipeline Orchestration
```bash
POST /api/orchestrate
{
  "generateImage": true,
  "imagePrompt": "Your image prompt",
  "generateCaption": true,
  "captionContext": "Context for caption",
  "tone": "professional",
  "postToLinkedIn": false
}
```

### Individual Services

**Generate Image**
```bash
POST /api/generate/image
{
  "prompt": "Your image prompt",
  "options": {
    "width": 1024,
    "height": 1024
  }
}
```

**Generate Caption**
```bash
POST /api/generate/caption
{
  "imageContext": "Image description",
  "tone": "professional"
}
```

**Generate Video**
```bash
POST /api/generate/video
{
  "prompt": "Your video prompt"
}
```

**Post to LinkedIn**
```bash
POST /api/linkedin/post
{
  "content": "Your post content",
  "imageUrl": "optional_image_url"
}
```

## Environment Variables

Required environment variables (see `.env.example`):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase service role key
- `LEONARDO_API_KEY` - Leonardo AI API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

Optional:
- `LINKEDIN_ACCESS_TOKEN` - LinkedIn OAuth token
- `LINKEDIN_PERSON_ID` - LinkedIn person URN

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Create a new project
3. Add all environment variables from `.env.example`
4. Deploy from the `mcp-server` directory
5. Railway will automatically use `railway.json` configuration

### Railway Environment Setup

In your Railway project settings, add these variables:
- All variables from `.env.example`
- Set `NODE_ENV=production`
- Set `PORT=3000` (Railway will inject $PORT automatically)

## Architecture

```
┌─────────────────┐
│   API Gateway   │
│   (Express)     │
└────────┬────────┘
         │
    ┌────▼────────────────────┐
    │   AI Router/Orchestrator│
    └────┬────────────────────┘
         │
    ┌────▼────┬────────┬────────┬────────┐
    │         │        │        │        │
┌───▼───┐ ┌──▼───┐ ┌─▼────┐ ┌─▼────┐ ┌▼────────┐
│Leonardo│ │Claude│ │GPT-4O│ │ VOAI │ │LinkedIn │
└────────┘ └──────┘ └──────┘ └──────┘ └─────────┘
                                            │
                                       ┌────▼────┐
                                       │Supabase │
                                       └─────────┘
```

## Monitoring & Logs

- Health checks run automatically every 5 minutes
- All operations are logged to Supabase `mcp_logs` table
- Pipeline results stored in `mcp_pipelines` table
- Access logs via Supabase dashboard or `/health` endpoint

## Error Handling & Fallbacks

- Claude → OpenAI automatic fallback for captions
- Service health tracking with failure counting
- Automatic retry logic with exponential backoff
- Graceful degradation when services are unavailable

## License

MIT
