# Environment Setup - Enterprise Health Monitoring

## Required Environment Variables

### Supabase Configuration

```bash
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0

# Server-side only
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI
```

### Telegram Notifications

```bash
TELEGRAM_BOT_TOKEN=8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg
TELEGRAM_CHANNEL_ID=@AuraFX_Hub
```

### Health Monitoring (Optional)

```bash
# N8N Webhook for incident recovery automation
N8N_WEBHOOK_URL=<your-n8n-webhook-url>
```

## GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. Go to: Settings → Secrets and variables → Actions
2. Add the following secrets:

- `SUPABASE_URL` = https://tjfeindwmpuyajvjftke.supabase.co
- `SUPABASE_SERVICE_KEY` = (service role key above)
- `SUPABASE_ANON_KEY` = (anon key above)
- `TELEGRAM_BOT_TOKEN` = 8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg
- `TELEGRAM_CHANNEL_ID` = @AuraFX_Hub
- `N8N_WEBHOOK_URL` = (if using N8N automation)

## Deployment Platforms

### Railway / Vercel / Netlify

Add environment variables in the platform's dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI
TELEGRAM_BOT_TOKEN=8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg
TELEGRAM_CHANNEL_ID=@AuraFX_Hub
PORT=3004
```

## Health Check Endpoints

### Application Health
- **Local**: http://localhost:3004/api/health
- **Production**: https://your-domain.com/api/health

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T21:19:15.290Z",
  "responseTime": "125ms",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "45ms"
    },
    "agents": {
      "status": "healthy",
      "mode": "production"
    },
    "rag": {
      "status": "healthy",
      "documentsCount": 42,
      "categoriesCount": 8
    }
  },
  "version": "1.0.0"
}
```

### Supabase Health Check
The GitHub Action workflow runs every 15 minutes to monitor Supabase connectivity.

## Monitoring Setup

### GitHub Actions
The workflow `.github/workflows/supabase-health.yml` automatically:
- Runs every 15 minutes
- Checks Supabase connectivity
- Logs results to `health_logs` table
- Sends Telegram alerts on failure
- Notifies N8N webhook for automated recovery

### Local Testing
```bash
# Test health check locally
cd scripts/health-checks
npm install
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co \
SUPABASE_SERVICE_KEY=<service-key> \
TELEGRAM_BOT_TOKEN=8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg \
TELEGRAM_CHANNEL_ID=@AuraFX_Hub \
node ping-supabase-enhanced.mjs
```

## Database Migration

### Apply Enterprise Health Cell Schema

The migration file is ready at: `MIGRATION-TO-APPLY.sql`

**Option 1: Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/sql/new
2. Paste contents of `MIGRATION-TO-APPLY.sql`
3. Click "Run"

**Option 2: psql Command Line**
```bash
# Get database password from Supabase Dashboard → Settings → Database
export PGPASSWORD='your-db-password'
psql "postgresql://postgres@db.tjfeindwmpuyajvjftke.supabase.co:5432/postgres" -f MIGRATION-TO-APPLY.sql
```

**Option 3: Supabase CLI**
```bash
supabase db push --db-url "postgresql://postgres:[password]@db.tjfeindwmpuyajvjftke.supabase.co:5432/postgres" --file MIGRATION-TO-APPLY.sql
```

### Verify Migration
After applying, verify tables exist:
```bash
node bootstrap-migration.mjs
```

Expected output:
```
✅ services                       (HTTP 200)
✅ health_checks                  (HTTP 200)
✅ metrics                        (HTTP 200)
✅ incidents                      (HTTP 200)
...
📊 Migration Status: 11/11 tables exist
```

## Production Checklist

- [ ] Environment variables configured in deployment platform
- [ ] GitHub secrets added for Actions workflow
- [ ] Supabase migration applied (`MIGRATION-TO-APPLY.sql`)
- [ ] Health check endpoint responding: `/api/health`
- [ ] GitHub Actions workflow enabled and passing
- [ ] Telegram notifications working
- [ ] Monitoring dashboard accessible (if applicable)

## Support

For issues or questions:
- Check logs: `.healthcell/local-logs.jsonl`
- Review GitHub Actions: https://github.com/your-repo/actions
- Telegram alerts: @AuraFX_Hub
