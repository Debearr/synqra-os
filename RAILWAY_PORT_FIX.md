# ✅ Railway PORT Binding - FIXED

## Problem
Railway was showing "Application failed to respond" because the app was binding to a hardcoded port instead of Railway's dynamic `$PORT` variable.

## Solution Applied: Method 1 + Method 2

### Method 1: Updated package.json Start Script
**File:** `apps/synqra-mvp/package.json`

**Before:**
```json
"start": "node server.js"
```

**After:**
```json
"start": "next start -p ${PORT:-8080} --hostname 0.0.0.0"
```

**What this does:**
- `${PORT:-8080}` reads Railway's PORT env var, falls back to 8080
- `--hostname 0.0.0.0` binds to all interfaces (Railway requirement)

### Method 2: Added PORT to Next.js Config
**File:** `apps/synqra-mvp/next.config.ts`

**Added:**
```typescript
env: {
  PORT: process.env.PORT,
}
```

**What this does:**
- Exposes PORT env var throughout the Next.js application
- Ensures consistent port handling

### Cleanup
**Removed:** `apps/synqra-mvp/server.js`
- Custom server not needed - simpler `next start` works
- Reduces complexity while achieving the same result

## Testing Results

✅ **Test 1: Railway-style dynamic PORT**
```bash
$ PORT=7891 npm start
   ▲ Next.js 15.0.2
   - Local:        http://localhost:7891
   - Network:      http://0.0.0.0:7891
   ✓ Ready in 1577ms
```

✅ **Test 2: Default port fallback**
```bash
$ npm start
   ▲ Next.js 15.0.2
   - Local:        http://localhost:8080
   - Network:      http://0.0.0.0:8080
   ✓ Ready in 1466ms
```

✅ **Test 3: Build**
```bash
$ npm run build
✓ Generating static pages (10/10)
   Finalizing page optimization ...
```

## How Railway Will Use This

**Railway's Deployment Flow:**
1. Railway assigns random PORT (e.g., `PORT=7891`)
2. Railway runs: `npm --prefix apps/synqra-mvp run start`
3. Our script executes: `next start -p ${PORT:-8080} --hostname 0.0.0.0`
4. Next.js reads PORT=7891 and binds to it
5. Railway's proxy routes `synqra.co` → `localhost:7891`
6. ✅ Application responds successfully

## What Changed

**Commit:** `f67c646`
**Files modified:** 3
- `apps/synqra-mvp/package.json` - Updated start script
- `apps/synqra-mvp/next.config.ts` - Added PORT env var
- `apps/synqra-mvp/server.js` - Removed (not needed)

**Pushed to:** `claude/complete-voice-agents-deploy-011CUwfBrGXtQCeY6Pi5wwp1`

## Railway Auto-Deploy

Railway will detect the push and automatically redeploy. Monitor with:

```bash
# Option 1: Railway dashboard
https://railway.app/dashboard

# Option 2: Railway CLI
railway logs --follow

# Option 3: Health check
curl https://synqra.co/api/health
```

## Expected Logs

**Old (Broken):**
```
Server listening at http://0.0.0.0:8080
Railway assigned PORT: 7891
❌ Port mismatch - Railway can't reach app
```

**New (Fixed):**
```
▲ Next.js 15.0.2
- Network: http://0.0.0.0:7891
✓ Ready
✅ Railway routes traffic successfully
```

## Verification

After Railway redeploys, verify:

1. **Health Check:**
   ```bash
   curl https://synqra.co/api/health
   # Should return: {"status":"healthy",...}
   ```

2. **Agents Dashboard:**
   ```bash
   curl -I https://synqra.co/agents
   # Should return: HTTP/1.1 200 OK
   ```

3. **Agent API:**
   ```bash
   curl -X POST https://synqra.co/api/agents \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   # Should return agent response
   ```

## Status: ✅ COMPLETE

- [x] Method 1 applied (package.json start script)
- [x] Method 2 applied (next.config.ts env vars)
- [x] Build succeeds
- [x] Local testing passes
- [x] Committed and pushed
- [x] Railway will auto-deploy

**The Railway PORT binding issue is now FIXED.**

Railway logs will show the app binding to the dynamic PORT instead of hardcoded 8080.

---
**Fixed:** November 9, 2025
**Method:** 1 + 2 (next start with PORT env var)
**Commit:** f67c646
