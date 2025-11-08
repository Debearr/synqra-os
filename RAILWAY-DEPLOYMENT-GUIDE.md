# SYNQRA.CO RAILWAY DEPLOYMENT GUIDE

## Current Status
✅ App is RUNNING on Railway (Ready in 773ms)
✅ Configuration files updated and committed
❌ Service is "Unexposed" - needs public domain setup

## Railway Credentials
- **Token**: `<your-railway-token>` (check Railway dashboard → Account Settings → Tokens)
- **Project**: `synqra-os` (Debearr/synqra-os)
- **Service**: `synqra-os`

---

## COMPLETE SETUP INSTRUCTIONS

### Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
```

If this fails, try:
```bash
npm i -g @railway/cli --force
```

Or download directly from: https://docs.railway.app/guides/cli

### Step 2: Authenticate with Railway

```bash
export RAILWAY_TOKEN=<your-railway-token>
railway whoami
```

Get your token from: https://railway.app/account/tokens

Expected output: Your Railway account information

### Step 3: Link to Project

```bash
cd /home/user/synqra-os
railway link
```

When prompted:
- Select project: **synqra-os**
- Select environment: **production**

### Step 4: Set Environment Variables

```bash
railway variables set N8N_WEBHOOK_URL=<your-n8n-webhook-url>
railway variables set LINKEDIN_CLIENT_ID=<your-linkedin-client-id>
railway variables set LINKEDIN_CLIENT_SECRET="<your-linkedin-client-secret>"
railway variables set NODE_ENV=production
```

**Note**: Use your actual credentials from the .env file or secure vault.

**Verify variables are set:**
```bash
railway variables
```

### Step 5: Generate Public Railway Domain

```bash
railway domain
```

This generates a URL like: `synqra-os-production.up.railway.app`

**IMPORTANT**: Save this URL - you'll need it for DNS configuration!

### Step 6: Add Custom Domains

```bash
railway domain add synqra.co
railway domain add www.synqra.co
```

### Step 7: Get DNS Configuration

```bash
railway domain list
```

Railway will display the DNS records you need to configure.

---

## DNS CONFIGURATION

After running `railway domain list`, you'll receive DNS record requirements. Add these to your DNS provider (Cloudflare, Namecheap, etc.):

### For synqra.co (Root Domain)

**Option A - If Railway provides A record:**
```
Type: A
Name: @
Value: [IP address from Railway]
TTL: 300 (or Auto)
```

**Option B - If Railway provides CNAME:**
```
Type: CNAME
Name: @
Value: [Railway proxy address]
TTL: 300 (or Auto)
```

### For www.synqra.co (WWW Subdomain)

```
Type: CNAME
Name: www
Value: [your-railway-domain].up.railway.app
TTL: 300 (or Auto)
```

**Example (using actual Railway domain from Step 5):**
```
Type: CNAME
Name: www
Value: synqra-os-production.up.railway.app
TTL: 300
```

---

## ALTERNATIVE: Railway Dashboard Setup

If CLI doesn't work, use the Railway dashboard:

### 1. Go to Railway Dashboard
https://railway.app/dashboard

### 2. Navigate to Your Service
- Click on **synqra-os** project
- Select **production** environment
- Click on your service

### 3. Add Environment Variables
- Go to **Variables** tab
- Click **+ New Variable**
- Add each variable (use your actual credentials):
  - `N8N_WEBHOOK_URL` = `<your-n8n-webhook-url>`
  - `LINKEDIN_CLIENT_ID` = `<your-linkedin-client-id>`
  - `LINKEDIN_CLIENT_SECRET` = `<your-linkedin-client-secret>`
  - `NODE_ENV` = `production`

### 4. Configure Networking
- Go to **Settings** tab
- Scroll to **Networking** section
- Click **Generate Domain** (generates Railway domain)
- Click **Custom Domain**
- Add `synqra.co`
- Add `www.synqra.co`

### 5. Copy DNS Records
Railway will show you the exact DNS records to add. Copy these and add them to your DNS provider.

---

## VERIFICATION

### Test Railway Domain (Immediate)

```bash
curl -I https://[your-railway-domain].up.railway.app
```

Expected: `HTTP/2 200 OK`

### Test Custom Domain (After DNS Propagation)

```bash
# Check DNS propagation
nslookup synqra.co

# Test HTTPS
curl -I https://synqra.co
curl -I https://www.synqra.co
```

Expected: `HTTP/2 200 OK`

**Note**: DNS propagation can take 5-60 minutes depending on your DNS provider.

---

## SUCCESS METRICS

After completing all steps, verify:

✅ **Railway CLI connected:**
```bash
railway status
```
Shows: Active, with domains listed

✅ **Environment variables set:**
```bash
railway variables
```
Shows all 4 variables

✅ **Domains configured:**
```bash
railway domain list
```
Shows:
- [generated].up.railway.app ✓
- synqra.co (pending DNS or active)
- www.synqra.co (pending DNS or active)

✅ **Service responding:**
```bash
curl -I https://[railway-domain].up.railway.app
```
Returns: HTTP/2 200

✅ **Logs showing app ready:**
```bash
railway logs
```
Shows: "Ready on http://0.0.0.0:8080"

---

## TROUBLESHOOTING

### Service shows "Unhealthy"
- Check logs: `railway logs --tail 100`
- Verify PORT binding in logs
- Ensure health check path "/" returns 200

### Domain not connecting
- Wait 10-15 minutes for DNS propagation
- Verify DNS records with: `nslookup synqra.co`
- Check Railway domain works first
- Ensure SSL/TLS is not forced in DNS settings (Railway handles this)

### Environment variables not working
- Redeploy after setting variables
- Check variable names are exact (case-sensitive)
- View in Railway dashboard: Settings → Variables

### Build failing
- Check logs for specific errors
- Verify buildCommand in railway.json
- Ensure dependencies are in package.json

---

## CURRENT CONFIGURATION FILES

All files have been updated and are ready for deployment:

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm --prefix apps/synqra-mvp run build"
  },
  "deploy": {
    "startCommand": "npm --prefix apps/synqra-mvp run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

### apps/synqra-mvp/package.json
```json
"start": "next start -p ${PORT:-3000} --hostname 0.0.0.0"
```

### Root package.json
```json
"start": "npm --prefix apps/synqra-mvp run start"
```

---

## NEXT STEPS

1. **Run the Railway CLI commands** (Steps 1-7 above)
2. **Configure DNS records** in your DNS provider
3. **Wait 5-15 minutes** for DNS propagation
4. **Test https://synqra.co** in your browser
5. **Verify SSL certificate** is automatically issued by Railway

---

## SUPPORT

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Check Service Status**: https://railway.app/dashboard

---

**Last Updated**: 2025-11-08
**Branch**: claude/fix-railway-deployment-011CUwEcxD1FhWC6g4LGDaT3
