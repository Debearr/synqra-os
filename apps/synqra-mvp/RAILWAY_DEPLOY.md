# Railway Deployment Guide

## Quick Deploy

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### Step 2: Deploy to Railway
1. Go to [railway.app/new](https://railway.app/new)
2. Select "Deploy from GitHub repo"
3. Choose: **Debearr/synqra-os**
4. Set Root Directory: **apps/synqra-mvp**
5. Railway will auto-detect Next.js and use configurations

### Step 3: Environment Variables
Set these in Railway dashboard (Settings > Variables):

**Required:**
```
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

**Optional (for full features):**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key
ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key
NODE_ENV=production
```

**Auto-set by Railway:**
```
PORT=3000 (Railway sets this automatically)
```

### Step 4: Deploy Configuration

**Build Command:** (Auto-detected from package.json)
```
npm install && npm run build
```

**Start Command:** (From Procfile)
```
npm run start
```

**Health Check:**
- Path: `/api/health`
- Method: GET
- Expected: HTTP 200

### Step 5: Verify Deployment
After deployment completes:

```bash
# Test health endpoint
curl https://your-app.up.railway.app/api/health

# Test content generation (demo mode)
curl -X POST https://your-app.up.railway.app/api/generate?demo=true \
  -H "Content-Type: application/json" \
  -d '{"brief":"Railway deployment test","platforms":["youtube","tiktok","x","linkedin"]}'
```

## Files Used by Railway

- `Procfile` - Process command (web: npm run start)
- `railway.json` - Railway-specific config (restart policy, builder)
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration

## Troubleshooting

### Build Fails
- Check Node version compatibility (requires 18+)
- Verify all dependencies in package.json
- Check Railway build logs

### 504 Timeout
- Verify health endpoint responds within 30 seconds
- Check server logs for startup errors
- Ensure PORT environment variable is used

### Database Connection Errors
- Verify Supabase credentials are set correctly
- Check Supabase project is active
- Test connection from local environment first

### Cold Start Slow
- Normal for first request (~5-10s)
- Railway will keep instance warm with traffic
- Health checks help maintain warm state

## Demo Mode
The app works without Supabase by adding `?demo=true`:
```
/api/generate?demo=true
```
This skips database writes and returns generated content directly.

## Monitoring
- Railway Dashboard: View logs, metrics, deployments
- Health Endpoint: `/api/health` - Returns service status
- Ready Endpoint: `/api/ready` - Readiness probe

## Scaling
Railway auto-scales based on:
- CPU usage
- Memory usage
- Request volume

Default: 1 instance, scales up to configured limit.
