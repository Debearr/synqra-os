# 🚀 SYNQRA OS - QUICK START GUIDE

## ⚡ INSTANT STARTUP (30 SECONDS)

### Option 1: Run Main App (Port 3000)
```bash
cd /workspace/apps/synqra-mvp
npm run dev
```
**Access:** http://localhost:3000

---

### Option 2: Run Dashboard (Port 3003)
```bash
cd /workspace/noid-dashboard
npm run dev -- -p 3003
```
**Access:** http://localhost:3003

---

### Option 3: Run Both Apps (Recommended)

**Terminal 1:**
```bash
cd /workspace/apps/synqra-mvp && npm run dev
```

**Terminal 2:**
```bash
cd /workspace/noid-dashboard && npm run dev -- -p 3003
```

---

## 🧪 TEST API ENDPOINTS

### Main App Endpoints
```bash
# Health Check
curl http://localhost:3000/api/health

# Generate Content (GET - Info)
curl http://localhost:3000/api/generate

# Generate Content (POST - Demo Mode)
curl -X POST http://localhost:3000/api/generate?demo=true \
  -H "Content-Type: application/json" \
  -d '{"brief":"How to build a content flywheel","platforms":["youtube","tiktok"]}'
```

---

## 🔄 COMMON COMMANDS

### Rebuild Everything
```bash
# synqra-mvp
cd /workspace/apps/synqra-mvp
rm -rf .next
npm run build

# noid-dashboard
cd /workspace/noid-dashboard
rm -rf .next
npm run build
```

### Reinstall Dependencies
```bash
# synqra-mvp
cd /workspace/apps/synqra-mvp
rm -rf node_modules
npm install

# noid-dashboard
cd /workspace/noid-dashboard
rm -rf node_modules
npm install
```

### Validate Everything
```bash
bash /workspace/validate-synqra.sh
```

---

## 🎯 KEY FEATURES READY

### synqra-mvp (Main App)
- ✅ Perfect Draft Engine (Homepage)
- ✅ Content Generation API
- ✅ Multi-platform support (YouTube, TikTok, X, LinkedIn)
- ✅ AI Agents (Sales, Support, Service)
- ✅ OAuth Integration (LinkedIn)
- ✅ Media Upload System
- ✅ Approval Workflow
- ✅ Retention Analytics

### noid-dashboard (Admin)
- ✅ Landing Page
- ✅ Dashboard (Analytics, Brand Voice, Calendar)
- ✅ Content Management
- ✅ Integrations
- ✅ Settings
- ✅ Stripe Webhook

---

## 🐛 QUICK TROUBLESHOOTING

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 3003
lsof -ti:3003 | xargs kill -9
```

### Build Fails
```bash
# Check environment variables
cat /workspace/apps/synqra-mvp/.env.local

# Clean rebuild
cd /workspace/apps/synqra-mvp
rm -rf .next node_modules
npm install
npm run build
```

### Supabase Connection Issues
```bash
# Test Supabase connectivity
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0" \
  https://tjfeindwmpuyajvjftke.supabase.co/rest/v1/
```

---

## 📁 KEY FILES & LOCATIONS

### Configuration Files
- `/workspace/.env` - Root environment variables
- `/workspace/apps/synqra-mvp/.env.local` - Main app config
- `/workspace/noid-dashboard/.env.local` - Dashboard config

### Validation Tools
- `/workspace/validate-synqra.sh` - Full system validation
- `/workspace/SYNQRA-VALIDATION-REPORT.md` - Detailed report

### Application Files
- `/workspace/apps/synqra-mvp/app/page.tsx` - Homepage
- `/workspace/apps/synqra-mvp/app/api/generate/route.ts` - Content API
- `/workspace/noid-dashboard/app/page.tsx` - Dashboard entry

---

## 🎯 PRODUCTION DEPLOYMENT

### Railway (Recommended)
```bash
cd /workspace/apps/synqra-mvp
railway up
```

### Vercel
```bash
cd /workspace/apps/synqra-mvp
vercel deploy --prod
```

---

## 🔐 ENVIRONMENT VARIABLES REQUIRED

```bash
# Supabase (Required)
SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_URL=https://tjfeindwmpuyajvjftke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Anthropic (Optional - for AI features)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# LinkedIn OAuth (Optional)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=...
```

---

## ✅ VERIFICATION CHECKLIST

Before deploying:
- [ ] Both apps build successfully
- [ ] Environment variables configured
- [ ] Supabase connection verified
- [ ] API endpoints tested
- [ ] Homepage loads correctly
- [ ] No console errors

Run validation:
```bash
bash /workspace/validate-synqra.sh
```

---

## 📞 HELP & SUPPORT

**Need Help?**
1. Run validation: `bash /workspace/validate-synqra.sh`
2. Check logs in `.next/` directories
3. Review `/workspace/SYNQRA-VALIDATION-REPORT.md`
4. Verify Supabase dashboard status

**Common Issues Fixed:**
- ✅ "supabaseKey is required" - FIXED
- ✅ "default export is not a React Component" - FIXED
- ✅ Build failures - FIXED
- ✅ Environment configuration - CONFIGURED

---

**Last Updated:** 2025-11-10  
**Status:** 🟢 ALL SYSTEMS READY
