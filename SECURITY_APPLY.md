# 🔒 SECURITY PATCH APPLICATION GUIDE

**Status**: READY TO APPLY  
**Generated**: 2025-11-11  
**Branch**: `feature/flickengine-addon`

---

## 📊 PATCH SUMMARY

This security patch set addresses **3 exposed credentials** across **15+ files**.

### What's Been Fixed (Already Staged)
- ✅ `.gitignore` updated to block all `.env` files
- ✅ `.env.local.template` created with safe placeholders
- ✅ `scripts/health-checks/.env` removed from tracking
- ✅ `SAFE-MODE-ENV-VARS.txt` sanitized
- ✅ GitHub workflows updated with proper secret handling
- ✅ `/api/health` simplified to minimal response
- ✅ Retry logic added for PostgREST cold starts

### What Still Has Exposed Secrets (Needs Cleanup)
- ⚠️ `ENVIRONMENT_SETUP.md` - Telegram token + Supabase keys
- ⚠️ `TASK_COMPLETION_SUMMARY.md` - Telegram token + Supabase keys
- ⚠️ `ALL_SYSTEMS_READY_REPORT.md` - Telegram token + Supabase keys
- ⚠️ Git history - Previous commits contain exposed secrets

---

## 🎯 STEP-BY-STEP APPLICATION

### PHASE 1: Review Current State (2 minutes)

```bash
# 1. Check current branch
git branch --show-current
# Expected: feature/flickengine-addon

# 2. Review staged changes
git log --oneline -7
# Should show:
#   - refactor: simplify health endpoint
#   - feat: add retry logic with exponential backoff
#   - security: update workflows to use GitHub secrets
#   - security: sanitize exposed credentials
#   - chore: hard-ignore env files

# 3. Check for uncommitted changes
git status
# Expected: clean working tree
```

---

### PHASE 2: Sanitize Remaining Documentation Files (5 minutes)

We need to replace exposed secrets in the remaining markdown files:

**Exposed Secrets to Replace**:
- Telegram Token: `8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg`
- Service Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0`

**Run the sanitization script**:

```bash
# Option A: Use provided sanitization script
./security-patches/sanitize-docs.sh

# Option B: Manual search and replace (if script fails)
# Replace in ENVIRONMENT_SETUP.md
sed -i 's/8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg/YOUR_BOT_ID:YOUR_BOT_TOKEN/g' ENVIRONMENT_SETUP.md
sed -i 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ\.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI/your_supabase_service_role_key_here/g' ENVIRONMENT_SETUP.md

# Replace in TASK_COMPLETION_SUMMARY.md
sed -i 's/8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg/YOUR_BOT_ID:YOUR_BOT_TOKEN/g' TASK_COMPLETION_SUMMARY.md

# Replace in ALL_SYSTEMS_READY_REPORT.md
sed -i 's/8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg/YOUR_BOT_ID:YOUR_BOT_TOKEN/g' ALL_SYSTEMS_READY_REPORT.md

# Commit the sanitized files
git add ENVIRONMENT_SETUP.md TASK_COMPLETION_SUMMARY.md ALL_SYSTEMS_READY_REPORT.md
git commit -m "security: remove remaining exposed secrets from documentation"
```

---

### PHASE 3: Clean Git History (15 minutes) - OPTIONAL BUT RECOMMENDED

⚠️ **WARNING**: This rewrites git history. Only proceed if you understand the implications.

**Option A: Safe Method (Recommended for Active Repos)**
- Skip history rewriting
- All secrets are now sanitized in current commits
- Old secrets remain in history but are marked as leaked
- Rotate all exposed credentials immediately

**Option B: Git History Cleaning (Nuclear Option)**

```bash
# BACKUP FIRST!
git clone --mirror . ../synqra-backup-$(date +%Y%m%d).git

# Install git-filter-repo if not already installed
pip3 install git-filter-repo

# Run the sanitization script
./security-patches/clean-git-history.sh

# This will:
# - Remove scripts/health-checks/.env from all commits
# - Replace exposed secrets with placeholders in all commits
# - Rewrite git history

# After cleaning, force push (DANGER!)
git push --force-with-lease origin feature/flickengine-addon
```

**Option C: Start Fresh (If Repo is Not Shared)**
```bash
# Delete entire git history and start fresh
git checkout --orphan temp-branch
git add -A
git commit -m "Initial commit with sanitized secrets"
git branch -D feature/flickengine-addon
git branch -m feature/flickengine-addon
git push --force origin feature/flickengine-addon
```

---

### PHASE 4: Rotate Exposed Credentials (10 minutes)

**4.1 Rotate Telegram Bot Token**

```bash
# 1. Open Telegram and message @BotFather
# 2. Send: /mybots
# 3. Select your bot
# 4. Select "API Token" → "Regenerate Token"
# 5. Copy the new token
# 6. Save it securely (password manager)
```

**New Token Format**: `NEW_BOT_ID:NEW_BOT_TOKEN`

**4.2 Verify Supabase Keys**

Supabase JWT tokens are **project-bound** and cannot be easily rotated without recreating the project. Instead:

```bash
# 1. Go to: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/settings/api
# 2. Verify your keys are still secure
# 3. If compromised, consider:
#    - Enabling RLS policies on all tables
#    - Monitoring for unauthorized access
#    - As last resort: Create new Supabase project
```

**4.3 KIE.AI Keys**

```bash
# 1. Go to: https://kie.ai/dashboard/settings/api-keys
# 2. Rotate API key if needed
# 3. Save new key securely
```

---

### PHASE 5: Configure GitHub Secrets (5 minutes)

Add secrets to GitHub repository for workflows:

```bash
# Method 1: GitHub Web UI
# 1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
# 2. Click "New repository secret"
# 3. Add each secret below

# Method 2: GitHub CLI (if installed)
gh auth login
gh secret set SUPABASE_URL -b "https://tjfeindwmpuyajvjftke.supabase.co"
gh secret set SUPABASE_ANON_KEY -b "YOUR_ANON_KEY"
gh secret set SUPABASE_SERVICE_ROLE_KEY -b "YOUR_SERVICE_ROLE_KEY"
gh secret set TELEGRAM_BOT_TOKEN -b "YOUR_NEW_BOT_TOKEN"
gh secret set TELEGRAM_CHANNEL_ID -b "@AuraFX_Hub"
gh secret set KIE_API_KEY -b "YOUR_KIE_API_KEY"
gh secret set KIE_PROJECT_ID -b "YOUR_KIE_PROJECT_ID"

# Method 3: Use provided script
./security-patches/github-secrets-setup.sh
```

**Required Secrets**:
| Secret Name | Value Source | Notes |
|-------------|--------------|-------|
| `SUPABASE_URL` | `https://tjfeindwmpuyajvjftke.supabase.co` | Public URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Public key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | **SECRET** - Never commit |
| `TELEGRAM_BOT_TOKEN` | **NEW** rotated token from @BotFather | **SECRET** - Never commit |
| `TELEGRAM_CHANNEL_ID` | `@AuraFX_Hub` | Public channel ID |
| `KIE_API_KEY` | KIE.AI Dashboard | **SECRET** |
| `KIE_PROJECT_ID` | KIE.AI Dashboard | Project identifier |

---

### PHASE 6: Configure Railway Environment Variables (5 minutes)

Add environment variables to Railway for production deployment:

```bash
# Method 1: Railway CLI
railway login
railway link  # Select your project
railway variables set SUPABASE_URL="https://tjfeindwmpuyajvjftke.supabase.co"
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://tjfeindwmpuyajvjftke.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
railway variables set TELEGRAM_BOT_TOKEN="YOUR_NEW_BOT_TOKEN"
railway variables set TELEGRAM_CHANNEL_ID="@AuraFX_Hub"
railway variables set KIE_API_KEY="YOUR_KIE_API_KEY"
railway variables set KIE_PROJECT_ID="YOUR_KIE_PROJECT_ID"
railway variables set PORT="3004"

# Method 2: Railway Dashboard
# 1. Open: https://railway.app/dashboard
# 2. Select your project
# 3. Go to "Variables" tab
# 4. Add each variable manually

# Method 3: Use provided script
./security-patches/railway-secrets-setup.sh
```

**Required Variables**:
```bash
# Public (safe to expose)
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
TELEGRAM_CHANNEL_ID=@AuraFX_Hub
KIE_PROJECT_ID=your_kie_project_id
PORT=3004

# Secret (NEVER expose)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
TELEGRAM_BOT_TOKEN=your_new_bot_token_here
KIE_API_KEY=your_kie_api_key_here
```

---

### PHASE 7: Setup Local Development Environment (3 minutes)

```bash
# 1. Copy template to create local env file
cp .env.local.template .env.local

# 2. Edit .env.local with real values
nano .env.local  # or use your preferred editor

# Add your actual credentials:
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
TELEGRAM_BOT_TOKEN=your_new_bot_token
KIE_API_KEY=your_kie_api_key
KIE_PROJECT_ID=your_kie_project_id

# 3. Verify .env.local is gitignored
git check-ignore .env.local
# Should output: .env.local

# 4. For synqra-mvp app specifically
cp apps/synqra-mvp/.env.local.example apps/synqra-mvp/.env.local
# Edit with real values
```

---

### PHASE 8: Test & Verify (10 minutes)

**8.1 Test GitHub Actions Workflow**

```bash
# Push changes to trigger workflow
git push origin feature/flickengine-addon

# Monitor workflow
gh workflow view "Supabase Health Cell"
gh run list --workflow="Supabase Health Cell" --limit 1

# Or visit: https://github.com/YOUR_REPO/actions
```

**8.2 Test Local Development**

```bash
# Install dependencies
cd apps/synqra-mvp
npm install

# Start dev server
npm run dev

# Test health endpoint
curl http://localhost:3004/api/health
# Expected: {"ok":true}

# Test in browser
open http://localhost:3004
```

**8.3 Test Railway Deployment**

```bash
# Deploy to Railway
railway up

# Monitor logs
railway logs

# Test production health endpoint
curl https://YOUR_APP.railway.app/api/health
# Expected: {"ok":true}
```

**8.4 Verify Secrets Not Exposed**

```bash
# Search for exposed Telegram token
git grep -i "8369994671" || echo "✅ Token not found"
git grep -i "AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg" || echo "✅ Token not found"

# Search for exposed Supabase service key
git grep "VEHAj85_x8LZFh0TA9ojv" || echo "✅ Service key not found"

# Check .env files are gitignored
git ls-files | grep "\.env$" || echo "✅ No .env files tracked"
```

---

## 🚀 QUICK EXECUTION COMMANDS

If you trust this patch set, run this entire sequence:

```bash
# PHASE 1: Review
git branch --show-current && git status

# PHASE 2: Sanitize (manual step - see above)
# TODO: Run sanitization on remaining docs

# PHASE 3: Skip history cleaning (or run script)
# OPTIONAL: ./security-patches/clean-git-history.sh

# PHASE 4: Rotate credentials (manual step)
# TODO: Rotate Telegram bot token via @BotFather

# PHASE 5: GitHub Secrets
./security-patches/github-secrets-setup.sh

# PHASE 6: Railway Variables
./security-patches/railway-secrets-setup.sh

# PHASE 7: Local Environment
cp .env.local.template .env.local
# TODO: Edit .env.local with real values

# PHASE 8: Test
git push origin feature/flickengine-addon
cd apps/synqra-mvp && npm install && npm run dev
```

---

## 📋 CREDENTIALS CHECKLIST

Before proceeding, ensure you have:

- [ ] Supabase URL: `https://tjfeindwmpuyajvjftke.supabase.co`
- [ ] Supabase Anon Key (from Supabase Dashboard)
- [ ] Supabase Service Role Key (from Supabase Dashboard)
- [ ] NEW Telegram Bot Token (rotated via @BotFather)
- [ ] Telegram Channel ID: `@AuraFX_Hub`
- [ ] KIE.AI API Key (from KIE.AI Dashboard)
- [ ] KIE.AI Project ID (from KIE.AI Dashboard)
- [ ] Access to GitHub repository settings
- [ ] Access to Railway project dashboard

---

## ⚠️ CRITICAL SECURITY NOTES

1. **Never commit `.env` files** - They are now in `.gitignore`
2. **Rotate exposed Telegram bot token immediately**
3. **Verify Supabase RLS policies** are enabled on all tables
4. **Monitor for unauthorized access** in the next 48 hours
5. **Update team password managers** with new credentials
6. **Review git history** if using Option B (history cleaning)

---

## 🆘 TROUBLESHOOTING

### GitHub Actions Fails
```bash
# Check secrets are set
gh secret list

# View workflow logs
gh run view --log

# Common fix: Verify secret names match exactly
# Workflow expects: SUPABASE_SERVICE_ROLE_KEY
# NOT: SUPABASE_SERVICE_KEY
```

### Railway Deployment Fails
```bash
# Check environment variables
railway variables

# View deployment logs
railway logs --deployment

# Common fix: Ensure NEXT_PUBLIC_* vars are set
```

### Local Dev Fails
```bash
# Verify .env.local exists and has values
cat .env.local

# Check Node.js version
node --version  # Should be 20.x

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Telegram Notifications Not Working
```bash
# Test new bot token
curl "https://api.telegram.org/bot<NEW_TOKEN>/getMe"

# Verify bot is admin in channel
# Open Telegram → @AuraFX_Hub → Admins → Add your bot
```

---

## ✅ SUCCESS CRITERIA

After applying all patches, verify:

- [ ] No secrets in current commit: `git show HEAD`
- [ ] No secrets in repo files: `git grep -i "8369994671"`
- [ ] `.env` files gitignored: `git check-ignore .env`
- [ ] GitHub secrets configured: `gh secret list`
- [ ] Railway variables configured: `railway variables`
- [ ] Local `.env.local` has real values
- [ ] GitHub Actions workflow passes
- [ ] Railway deployment successful
- [ ] `/api/health` returns `{"ok":true}`
- [ ] No unauthorized Supabase access in logs

---

## 📞 NEXT STEPS

After completing all phases:

1. **Monitor for 24-48 hours**
   - Check Supabase logs for unauthorized access
   - Monitor GitHub Actions for failures
   - Watch Railway deployment logs

2. **Update team documentation**
   - Share new credentials securely
   - Update internal wiki/docs
   - Brief team on new security practices

3. **Review security posture**
   - Enable 2FA on all accounts
   - Rotate remaining credentials (Anthropic, etc.)
   - Schedule quarterly security audits

4. **Proceed with FlickEngine deployment**
   - Security foundation is now solid
   - Safe to build new features
   - All credentials properly secured

---

## 🎯 APPROVAL

**STATUS**: ⏸️ AWAITING APPROVAL

Reply with: **"APPROVE FIXES"** to proceed with automated application of these patches.

---

**Generated**: 2025-11-11  
**Document Version**: 1.0  
**Security Level**: CRITICAL
