# ⚡ Synqra Waitlist - 5-Minute Quickstart

## 🚀 TL;DR - Deploy in 5 Steps

```bash
# 1. Navigate to synqra-mvp
cd apps/synqra-mvp

# 2. Copy environment template
cp .env.local.example .env.local

# 3. Edit .env.local with your Supabase credentials
# Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

# 4. Run SQL migration in Supabase SQL Editor
# Copy/paste: lib/posting/schema/waitlist-setup.sql

# 5. Test locally
npm run dev
# Visit: http://localhost:3000/waitlist
```

---

## 📁 What's Included

```
apps/synqra-mvp/
├── lib/
│   ├── supabaseAdmin.ts              ✅ Service role client
│   └── posting/schema/
│       └── waitlist-setup.sql        ✅ Database migration
├── app/
│   ├── api/waitlist/route.ts         ✅ API endpoint
│   └── waitlist/
│       ├── page.tsx                  ✅ Form page
│       └── success/page.tsx          ✅ Success page
└── .env.local.example                ✅ Environment template
```

---

## 🔐 Environment Variables

Add to `.env.local`:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE=eyJhbGc...  # ⚠️ Secret! Never commit!
```

---

## 🗄️ Database Setup

**Run this in Supabase SQL Editor:**

```sql
-- Copy from: lib/posting/schema/waitlist-setup.sql
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at DESC);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Test Checklist

- [ ] Form loads at `/waitlist`
- [ ] Email validation works
- [ ] Submit redirects to `/waitlist/success`
- [ ] Duplicate email shows error
- [ ] Entry appears in Supabase table
- [ ] API returns count at `/api/waitlist` (GET)

---

## 🌐 Deploy to Production

### Vercel Dashboard

1. Go to **Settings** → **Environment Variables**
2. Add all 3 Supabase variables
3. Redeploy

### Vercel CLI

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE
vercel --prod
```

---

## 📊 View Signups

**Supabase Dashboard:**
- Go to **Table Editor** → `waitlist`

**SQL Query:**
```sql
SELECT email, full_name, created_at
FROM public.waitlist
ORDER BY created_at DESC;
```

---

## 🚨 Common Issues

### "Missing SUPABASE_SERVICE_ROLE"
→ Add to `.env.local` or Vercel environment variables

### "Table doesn't exist"
→ Run the SQL migration in Supabase SQL Editor

### "Already registered" not working
→ Verify UNIQUE constraint:
```sql
\d public.waitlist
```

---

## 📱 Share the Waitlist

**URL**: `https://your-app.vercel.app/waitlist`

**LinkedIn Post**:
```
Synqra is entering early access.

Join the first 50 founders for priority onboarding:
👉 https://your-app.vercel.app/waitlist

#Synqra #NOID #AIAutomation
```

---

## 📚 Full Documentation

See `WAITLIST-SETUP.md` for:
- Security checklist
- Stress testing
- Analytics integration
- Custom domain setup
- Troubleshooting guide

---

**Status**: ✅ Production-ready  
**Time to Deploy**: ~5 minutes  
**Support**: See WAITLIST-SETUP.md
