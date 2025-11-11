# n8n Workflow Configuration Guide
Generated: 2025-11-10

## Overview

This guide explains how to set up the Synqra OS n8n workflows for automated content publishing and retention tracking.

## Prerequisites

1. **n8n Instance**: Self-hosted or n8n.cloud
2. **Supabase Access**: API URL and keys
3. **Platform APIs**: YouTube API key (free), OAuth tokens for other platforms

## Available Workflows

### 1. Content Publish Stub
**Location:** `/infra/workflows/deployment/publish-stub-n8n.json`

**Purpose:** Fetches content jobs from Supabase and prepares them for multi-platform publishing

**Setup Steps:**

1. **Import Workflow**
   - Open your n8n instance
   - Go to Workflows > Import from File
   - Select `publish-stub-n8n.json`

2. **Configure Supabase Connection**
   - Edit "Fetch Latest Job" node
   - Replace `YOUR_SUPABASE_PROJECT` with: `tjfeindwmpuyayjvftke`
   - Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

3. **Extend with Platform APIs**
   - Add HTTP Request nodes for each platform:
     - **LinkedIn**: Use LinkedIn Share API
     - **TikTok**: Use TikTok Content Posting API
     - **X (Twitter)**: Use X API v2
     - **YouTube**: Use YouTube Data API v3

4. **Test**
   - Click "Execute Workflow" to test
   - Verify it fetches your latest content job

### 2. YouTube Retention Tracker
**Location:** `/infra/workflows/deployment/youtube-retention-n8n.json`

**Purpose:** Fetches YouTube video analytics and saves retention data to Supabase

**Setup Steps:**

1. **Get YouTube API Key** (FREE)
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create a new API key
   - Enable YouTube Data API v3
   - Copy the API key

2. **Import Workflow**
   - Import `youtube-retention-n8n.json` into n8n

3. **Configure YouTube API**
   - Edit "YouTube Data API v3" node
   - Replace `YOUR_YOUTUBE_API_KEY_HERE` with your API key

4. **Configure Video IDs**
   - Edit "Video IDs" node
   - Add your YouTube video IDs (one per execution)
   - For multiple videos, use a Split node

5. **Configure Retention API Endpoint**
   - Edit "POST to Retention API" node
   - Update URL to: `https://synqra.co/api/retention/notes`
   - Or your custom deployment URL

6. **Set Schedule**
   - Edit "Schedule Trigger" node
   - Default: Daily at 9 AM
   - Adjust timezone and frequency as needed

7. **Test**
   - Click "Execute Workflow"
   - Verify data is posted to your retention API

## Environment Variables in n8n

If using n8n with environment variables:

```bash
# Supabase
SUPABASE_URL=https://tjfeindwmpuyayjvftke.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# YouTube
YOUTUBE_API_KEY=your-youtube-api-key

# Synqra API
SYNQRA_API_URL=https://synqra.co
```

## Testing Checklist

- [ ] Supabase connection works
- [ ] Content jobs are fetched correctly
- [ ] YouTube API returns video data
- [ ] Retention data is saved to Supabase
- [ ] Error handling works (try with invalid video ID)
- [ ] Schedule trigger activates at correct time

## Monitoring

**Check Workflow Executions:**
- n8n Dashboard > Executions
- Filter by workflow name
- Review success/failure logs

**Check Supabase Data:**
- Open Supabase Dashboard
- Navigate to Table Editor
- Check `retention_notes` table for new entries

**Health Check:**
- Test endpoint: `https://synqra.co/api/health`
- Should return `{"status": "healthy"}`

## Advanced: OAuth Setup

For platforms requiring OAuth (LinkedIn, TikTok, YouTube uploads):

1. **LinkedIn**
   - Create app at: https://www.linkedin.com/developers/
   - Add OAuth 2.0 credentials to n8n
   - Use n8n's built-in LinkedIn node

2. **TikTok**
   - Apply for TikTok Developer account
   - Create app and get credentials
   - Use HTTP Request with OAuth2

3. **YouTube Uploads**
   - Enable YouTube Data API v3
   - Set up OAuth 2.0 consent screen
   - Use n8n's YouTube node with OAuth

## Troubleshooting

**Supabase Connection Failed**
- Verify API keys are correct
- Check RLS policies allow service role access
- Ensure table names match exactly

**YouTube API Errors**
- Verify API key is active
- Check quota limits (10,000 units/day free)
- Ensure video ID is correct

**Workflow Not Executing**
- Check schedule trigger timezone
- Verify workflow is activated (toggle on)
- Review execution logs for errors

**Retention Data Not Saving**
- Check API endpoint URL
- Verify Supabase table exists
- Review API response in n8n logs

## Support

- **Supabase Docs**: https://supabase.com/docs
- **n8n Docs**: https://docs.n8n.io
- **YouTube API Docs**: https://developers.google.com/youtube/v3

## Next Steps

1. ✅ Import both workflows
2. ✅ Configure API credentials
3. ✅ Test each workflow manually
4. ✅ Enable schedule triggers
5. ✅ Monitor execution logs
6. 🚀 Extend with additional platforms

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
