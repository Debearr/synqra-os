# Synqra Posting Pipeline Deployment Guide

## Overview

This deployment adds a complete posting pipeline to Synqra, enabling automated content distribution across multiple social media platforms.

## Features

✅ **Multi-Platform Support**
- LinkedIn (fully implemented)
- TikTok (stub - requires OAuth)
- YouTube (stub - requires OAuth)
- X/Twitter (stub - requires OAuth)
- Instagram (stub - requires OAuth)

✅ **Safety Guards**
- DRY_RUN mode (enabled by default)
- POSTING_ENABLED flag (disabled by default)
- Approval requirements
- Retry logic with exponential backoff

✅ **Infrastructure**
- Queue-based posting system
- OAuth token management
- Scheduled post tracking
- Comprehensive logging

## Database Schema

The posting pipeline requires additional database tables. Run the schema:

```bash
# Option 1: Manually in Supabase SQL Editor
# Copy and paste: lib/posting/schema/posting-pipeline.sql

# Option 2: Programmatically (when credentials are configured)
npx tsx lib/posting/schema/apply-schema.ts
```

### Tables Created:

1. **social_tokens** - OAuth tokens for platforms
2. **scheduled_posts** - Queue of scheduled posts
3. **posting_logs** - Historical log of posting attempts

## Environment Variables

### Required for Supabase

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Posting Pipeline Configuration

```bash
# Safety controls
DRY_RUN=true                    # Set false to enable actual posting
POSTING_ENABLED=false           # Set true to enable posting API
APPROVAL_REQUIRED=true          # Require approval before posting
DEFAULT_TIMEZONE=America/Toronto
```

### Social Platform Credentials

```bash
# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=

# TikTok
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=

# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# X (Twitter)
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=

# Instagram
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_ACCESS_TOKEN=
```

## API Endpoints

### POST /api/publish

Publish content to social media platforms.

**Request:**
```json
{
  "jobId": "uuid",
  "platforms": ["LinkedIn", "YouTube"],
  "payloads": {
    "LinkedIn": {
      "text": "Your post content",
      "media": [
        {
          "url": "https://example.com/image.jpg",
          "title": "Image title"
        }
      ]
    }
  }
}
```

**Response:**
```json
{
  "ok": true,
  "jobId": "uuid",
  "enqueued": ["LinkedIn"],
  "dryRun": true,
  "message": "Jobs enqueued in DRY_RUN mode - no actual posts will be made"
}
```

### GET /api/status

Check posting system status.

**Response:**
```json
{
  "ok": true,
  "status": "operational",
  "config": {
    "dryRun": true,
    "postingEnabled": false,
    "approvalRequired": true
  },
  "queue": {
    "size": 0
  },
  "timestamp": "2025-11-09T00:00:00.000Z"
}
```

## Railway Deployment

### Prerequisites

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

### Deploy Steps

1. **Set environment variables:**
   ```bash
   # Safety controls (start with these!)
   railway variables set DRY_RUN=true
   railway variables set POSTING_ENABLED=false
   railway variables set APPROVAL_REQUIRED=true

   # Supabase credentials
   railway variables set SUPABASE_URL="https://your-project.supabase.co"
   railway variables set SUPABASE_ANON_KEY="your-anon-key"
   railway variables set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Add social platform credentials as needed
   railway variables set LINKEDIN_CLIENT_ID="your-client-id"
   railway variables set LINKEDIN_CLIENT_SECRET="your-client-secret"
   ```

2. **Deploy:**
   ```bash
   railway up
   ```

3. **Get deployment URL:**
   ```bash
   railway domain
   ```

4. **Check status:**
   ```bash
   curl https://your-app.railway.app/api/status
   ```

### Enabling Live Posting

⚠️ **Only after thorough testing!**

1. Test in DRY_RUN mode first
2. Verify all OAuth credentials are valid
3. Test with a single platform
4. Enable posting:

```bash
railway variables set DRY_RUN=false
railway variables set POSTING_ENABLED=true
railway restart
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Run database migrations:**
   ```bash
   npx tsx lib/posting/schema/apply-schema.ts
   ```

4. **Start dev server:**
   ```bash
   npm run dev:3004
   ```

5. **Test endpoints:**
   ```bash
   # Check status
   curl http://localhost:3004/api/status

   # Test publish (dry run)
   curl -X POST http://localhost:3004/api/publish \
     -H "Content-Type: application/json" \
     -d '{
       "jobId": "test-123",
       "platforms": ["LinkedIn"],
       "payloads": {
         "LinkedIn": {
           "text": "Test post from Synqra"
         }
       }
     }'
   ```

## OAuth Setup Guide

### LinkedIn

1. Go to: https://www.linkedin.com/developers/
2. Create an app
3. Add OAuth 2.0 scopes: `w_member_social`
4. Set redirect URI
5. Get Client ID and Secret

### TikTok

1. Go to: https://developers.tiktok.com/
2. Create an app
3. Follow TikTok's OAuth flow
4. Implement token refresh logic

### YouTube

1. Go to: https://console.cloud.google.com/
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Set up consent screen

### X (Twitter)

1. Go to: https://developer.twitter.com/
2. Create a project and app
3. Enable OAuth 2.0
4. Get API keys and tokens

### Instagram

1. Go to: https://developers.facebook.com/
2. Create a Facebook app
3. Add Instagram Basic Display or Graph API
4. Get access token

## Monitoring

- Check posting logs in Supabase: `posting_logs` table
- Monitor queue size: `GET /api/status`
- Review scheduled posts: `scheduled_posts` table

## Troubleshooting

### Build fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Token errors
- Check token expiration in `social_tokens` table
- Re-authenticate via OAuth flow
- Verify scopes are correct

### Posts not publishing
- Verify `POSTING_ENABLED=true`
- Check `DRY_RUN=false`
- Review `posting_logs` for errors
- Ensure valid OAuth tokens

## Security Notes

⚠️ **Never commit:**
- `.env.local` file
- OAuth secrets
- Service role keys

✅ **Always:**
- Use environment variables
- Enable RLS on Supabase
- Start with DRY_RUN=true
- Test thoroughly before going live
- Monitor posting logs

## Support

For issues or questions:
1. Check `posting_logs` table for error messages
2. Review environment variables
3. Test OAuth tokens separately
4. Verify database schema is applied

---

**Last Updated:** 2025-11-09
**Version:** 1.0.0
