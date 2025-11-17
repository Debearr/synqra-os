# 🚨 RAILWAY 502 BAD GATEWAY FIX - COMPLETE

## Root Cause Identified

**Critical Issue:** Module-level `throw new Error()` in `lib/supabaseAdmin.ts` was causing immediate crash on app startup when environment variables were missing.

### The Problem

```typescript
// OLD CODE (CRASHES ON IMPORT)
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}
```

When Railway starts the app without proper environment variables, this throws **immediately during module import**, causing the entire Node.js process to crash before it can even bind to the port.

**Result:** Railway sees "Ready in XXXms" but then the process dies → 502 Bad Gateway

## Fixes Applied ✅

### 1. **Fixed Supabase Admin Client** ✅
- Removed module-level `throw` statement
- Added graceful degradation with placeholder values
- Added `isSupabaseAdminConfigured()` helper function
- App now starts successfully even without credentials

**File:** `apps/synqra-mvp/lib/supabaseAdmin.ts`

### 2. **Protected Waitlist API** ✅
- Added config check before database operations
- Returns 503 Service Unavailable if Supabase not configured
- Prevents crashes when admin client is misconfigured

**File:** `apps/synqra-mvp/app/api/waitlist/route.ts`

### 3. **Added Health Check Endpoint** ✅
- New `/api/health` endpoint for monitoring
- Shows environment variable status
- Returns memory usage and uptime
- Always returns 200 OK if app is running

**File:** `apps/synqra-mvp/app/api/health/route.ts`

### 4. **Added Global Error Boundary** ✅
- Catches unhandled React errors
- Shows user-friendly error page
- Prevents white screen of death
- Logs errors for debugging

**File:** `apps/synqra-mvp/app/error.tsx`

### 5. **Created Environment Variable Guide** ✅
- Documented all required variables
- Provided Railway CLI commands
- Clear instructions for production setup

**File:** `apps/synqra-mvp/.env.production.example`

## Required Railway Environment Variables

### ✅ Set These in Railway Dashboard

**Navigate to:** Railway Dashboard → Your Project → Variables Tab

**Critical Variables (App won't fully function without these):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_SERVICE_KEY=eyJ... (your service role key)
ANTHROPIC_API_KEY=sk-ant-api03-... (your Claude API key)
NODE_ENV=production
```

### Railway CLI Commands (Alternative Method)

If you have Railway CLI installed:

```bash
# Install Railway CLI first (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
railway variables set SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJ...
railway variables set SUPABASE_SERVICE_KEY=eyJ...
railway variables set ANTHROPIC_API_KEY=sk-ant-api03-...
railway variables set NODE_ENV=production
```

## Testing After Deployment

### 1. Health Check
```bash
curl https://synqra.co/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "synqra-mvp",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseAnonKey": true,
    "hasSupabaseServiceKey": true,
    "hasAnthropicKey": true,
    "nodeEnv": "production",
    "port": "3000"
  },
  "uptime": 123.45,
  "memory": {
    "heapUsed": 45,
    "heapTotal": 60,
    "rss": 120
  }
}
```

### 2. Homepage
```bash
curl https://synqra.co
```

Should return HTML (not 502)

### 3. Waitlist API
```bash
curl https://synqra.co/api/waitlist
```

Should return `{"count": 0}` (or actual count)

## Deployment Steps

### Automatic (Already done by git push)

```bash
# Changes are committed and pushed
git push origin main
```

Railway will automatically:
1. Detect the push
2. Build the app
3. Deploy with new fixes
4. App should now start successfully

### Manual Trigger (If needed)

In Railway Dashboard:
1. Go to Deployments
2. Click "Deploy" button
3. Select latest commit
4. Monitor deployment logs

## Verification Checklist

- [ ] App starts without crashing (check Railway logs)
- [ ] https://synqra.co returns HTML (not 502)
- [ ] https://synqra.co/api/health returns JSON
- [ ] Railway logs show no error stack traces
- [ ] Environment variables all set in Railway

## Current Status

**Before Fix:**
- ❌ App crashes immediately on start
- ❌ 502 Bad Gateway on synqra.co
- ❌ Module-level error throws
- ❌ No error boundaries

**After Fix:**
- ✅ App starts successfully even without all env vars
- ✅ Graceful degradation for missing credentials
- ✅ Health check endpoint available
- ✅ Global error boundary
- ✅ Protected API routes

## Next Steps

1. **Set Environment Variables** in Railway Dashboard (most critical)
2. **Verify Deployment** - Check https://synqra.co
3. **Test Core Features:**
   - Landing page loads
   - Signin page works
   - Waitlist submission (once Supabase configured)
4. **Monitor Logs** in Railway Dashboard
5. **Set up Sentry/LogRocket** for production error tracking (optional)

## Files Changed

```
✅ apps/synqra-mvp/lib/supabaseAdmin.ts (fixed module-level throw)
✅ apps/synqra-mvp/app/api/waitlist/route.ts (added config checks)
✅ apps/synqra-mvp/app/api/health/route.ts (new health endpoint)
✅ apps/synqra-mvp/app/error.tsx (new error boundary)
✅ apps/synqra-mvp/.env.production.example (environment guide)
```

## Support

If issues persist after setting environment variables:

1. Check Railway logs for errors
2. Verify all env vars are set correctly
3. Check Supabase project status
4. Review health endpoint response
5. Contact Railway support if needed

---

**Fix Applied:** November 16, 2025  
**Status:** ✅ READY FOR DEPLOYMENT  
**Deployment:** Automatic on git push
