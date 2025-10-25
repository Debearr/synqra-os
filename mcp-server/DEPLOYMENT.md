# MCP Server Deployment Guide

Complete deployment guide for the Synqra MCP Orchestration Server.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Railway account (or alternative hosting)
- API keys for:
  - Leonardo AI
  - Anthropic Claude
  - OpenAI
  - LinkedIn (optional)

## Step 1: Database Setup (Supabase)

1. Log in to [Supabase](https://supabase.com)
2. Create a new project or use existing one
3. Go to SQL Editor
4. Run the SQL script from `supabase-schema.sql`
5. Verify tables created: `mcp_logs`, `mcp_pipelines`, `mcp_service_health`, `mcp_linkedin_posts`

## Step 2: Local Testing (Optional but Recommended)

```bash
cd mcp-server
npm install
cp .env.example .env
```

Edit `.env` with your actual API keys:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
LEONARDO_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
PORT=3000
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

Test the endpoints:
```bash
npm test
```

## Step 3: Railway Deployment

### Option A: Deploy via Railway Dashboard

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `Debearr/synqra-os` repository
5. Set root directory to `mcp-server`
6. Add environment variables (see below)
7. Click "Deploy"

### Option B: Deploy via Railway CLI

```bash
npm install -g @railway/cli
railway login
cd mcp-server
railway init
railway up
```

### Required Environment Variables in Railway

Navigate to your project settings → Variables, and add:

```
SUPABASE_URL=https://tjfeindwmpuyajyjtfke.supabase.co
SUPABASE_KEY=your_service_role_key_here
LEONARDO_API_KEY=your_leonardo_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
NODE_ENV=production
PORT=3000
```

Optional (for LinkedIn integration):
```
LINKEDIN_ACCESS_TOKEN=your_token
LINKEDIN_PERSON_ID=your_person_id
```

## Step 4: Verify Deployment

Once deployed, Railway will provide you with a URL (e.g., `https://your-app.railway.app`).

Test the health endpoint:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-25T...",
  "services": {
    "leonardo": { "status": "healthy", ... },
    "claude": { "status": "healthy", ... },
    ...
  }
}
```

## Step 5: Test Full Pipeline

```bash
curl -X POST https://your-app.railway.app/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "generateImage": true,
    "imagePrompt": "A futuristic AI workspace",
    "generateCaption": true,
    "captionContext": "AI automation in action",
    "tone": "professional"
  }'
```

## Step 6: Set Up CI/CD (Optional)

The GitHub Actions workflow (`.github/workflows/mcp-deploy.yml`) is already configured.

To enable automatic health checks after deployment:

1. Go to your GitHub repository settings
2. Navigate to Secrets and Variables → Actions
3. Add secret: `RAILWAY_APP_URL` with value `https://your-app.railway.app`

## Step 7: LinkedIn Integration (Optional)

If you want to enable LinkedIn auto-posting:

1. Create a LinkedIn App at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Get OAuth 2.0 access token with `w_member_social` permission
3. Get your LinkedIn Person ID
4. Add to Railway environment variables:
   ```
   LINKEDIN_ACCESS_TOKEN=your_token
   LINKEDIN_PERSON_ID=your_person_id
   ```
5. Restart the Railway service

## Monitoring & Maintenance

### View Logs

**Railway Dashboard:**
- Go to your project → Deployments → View Logs

**Supabase:**
- Query `mcp_logs` table for detailed operation logs
- Use `mcp_pipeline_stats` view for performance metrics

### Health Monitoring

The server automatically:
- Runs health checks every 5 minutes
- Logs all service failures
- Implements automatic fallbacks
- Restarts on failure (Railway policy)

### Performance Metrics

Query Supabase for insights:

```sql
-- Pipeline success rate (last 24h)
SELECT * FROM mcp_pipeline_stats;

-- Current service health
SELECT * FROM mcp_service_health_summary;

-- Recent errors
SELECT * FROM mcp_logs
WHERE level = 'error'
ORDER BY timestamp DESC
LIMIT 10;
```

## Troubleshooting

### Server won't start

- Check Railway logs for errors
- Verify all environment variables are set
- Check Node version (must be 18+)

### Services showing as unhealthy

- Verify API keys are correct
- Check API rate limits
- Review `mcp_logs` table for specific errors

### LinkedIn posting fails

- Verify OAuth token is valid (tokens expire)
- Check token has `w_member_social` permission
- Verify Person ID is correct

### Database connection issues

- Verify Supabase URL and key
- Check Supabase project is active
- Ensure tables are created (run schema.sql)

## Scaling Considerations

For high-volume usage:

1. **Railway**: Upgrade to Pro plan for more resources
2. **Supabase**: Monitor database usage and upgrade if needed
3. **Rate Limits**: Implement request queuing for API calls
4. **Caching**: Add Redis for response caching
5. **Load Balancing**: Deploy multiple instances with Railway

## Security Recommendations

1. Never commit `.env` file to git
2. Rotate API keys regularly
3. Use Railway's secret management
4. Enable Supabase RLS policies
5. Add API authentication (JWT, API keys)
6. Implement rate limiting on endpoints
7. Monitor for unusual activity in logs

## Next Steps

- Set up monitoring alerts (Railway + Supabase webhooks)
- Implement API authentication
- Add request rate limiting
- Create admin dashboard
- Set up automated backups
- Configure custom domain

## Support

For issues or questions:
- Check Railway deployment logs
- Review Supabase logs table
- Check GitHub Actions workflow runs
- Review this deployment guide

## Architecture Diagram

```
GitHub Repo (Debearr/synqra-os)
         ↓
    GitHub Actions (CI/CD)
         ↓
    Railway Platform
         ↓
   MCP Server (Node.js/Express)
         ↓
    ┌────┴────┬──────────┬──────────┐
    ↓         ↓          ↓          ↓
Leonardo  Claude    OpenAI     Supabase
   AI      API        API      (Database)
                                  ↓
                              Logging &
                              Analytics
```

**Deployment Complete!** Your MCP Orchestration Server is now live and ready to automate AI workflows.
