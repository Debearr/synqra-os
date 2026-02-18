
# 🎯 Synqra Waitlist - Deployment Guide

## ✅ Implementation Complete

All files have been created and are production-ready:
- ✅ `lib/supabaseAdmin.ts` - Service role client with validation
- ✅ `app/api/waitlist/route.ts` - API endpoint with error handling
- ✅ `app/waitlist/page.tsx` - Responsive form with loading states
- ✅ `app/waitlist/success/page.tsx` - Post-signup confirmation
- ✅ `lib/posting/schema/waitlist-setup.sql` - Database schema

---

## 🗄️ Step 1: Supabase Database Setup

### Run SQL Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `lib/posting/schema/waitlist-setup.sql`
4. Click **Run** to execute

The migration creates:
- `waitlist` table with UNIQUE email constraint
- Performance indexes
- Row Level Security (RLS) enabled
- Metadata field for future tracking

### Verify Table Creation

```sql
-- Run this to verify the table exists
SELECT * FROM public.waitlist LIMIT 1;
```

---

## 🔐 Step 2: Environment Variables

### Local Development (`.env.local`)

Create or update `.env.local` in the `apps/synqra-mvp/` directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE=your-service-role-secret-key
```

### Find Your Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE` ⚠️ SECRET!

⚠️ **SECURITY WARNING**: 
- NEVER commit `SUPABASE_SERVICE_ROLE` to git
- Only use it in server-side code (API routes)
- Add `.env.local` to `.gitignore`

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables for **Production**, **Preview**, and **Development**:

```
SUPABASE_URL = https://your-project-ref.supabase.co
SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE = your-service-role-key
```

4. Redeploy your app (Vercel will auto-detect changes)

### Option B: Vercel CLI

```bash
# In apps/synqra-mvp directory
vercel env add SUPABASE_URL
# Paste your URL when prompted

vercel env add SUPABASE_ANON_KEY
# Paste your anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE
# Paste your service role key when prompted

# Deploy
vercel --prod
```

---

## 🧪 Step 4: Test the Implementation

### Local Testing

```bash
cd apps/synqra-mvp
npm run dev
```

Visit: `http://localhost:3000/waitlist`

### Test Cases

1. **Valid Submission**
   - Enter: `test@example.com`
   - Expected: Redirect to `/waitlist/success`

2. **Duplicate Email**
   - Submit same email twice
   - Expected: "You're already on the list!" message

3. **Invalid Email**
   - Enter: `notanemail`
   - Expected: "Please enter a valid email address"

4. **Network Failure**
   - Turn off network, submit form
   - Expected: "Unable to join waitlist. Please try again."

### API Endpoint Testing

```bash
# Test POST (join waitlist)
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "full_name": "Test User"}'

# Test GET (waitlist count)
curl http://localhost:3000/api/waitlist
```

---

## 🌐 Step 5: Custom Domain Setup (Optional)

### Namecheap DNS Configuration

If you want `waitlist.getluxgrid.com`:

1. Log in to Namecheap
2. Go to **Domain List** → **Manage** → **Advanced DNS**
3. Add a new record:

```
Type: CNAME
Host: waitlist
Value: cname.vercel-dns.com
TTL: Automatic (or 300)
```

4. In Vercel dashboard:
   - Go to **Settings** → **Domains**
   - Add `waitlist.getluxgrid.com`
   - Wait 10-30 minutes for DNS propagation

---

## 📊 Step 6: View Waitlist Data

### Supabase Dashboard

1. Go to **Table Editor** → `waitlist`
2. View all entries in real-time

### SQL Queries

```sql
-- View all waitlist entries
SELECT id, email, full_name, created_at, metadata
FROM public.waitlist
ORDER BY created_at DESC;

-- Get total count
SELECT COUNT(*) as total_signups FROM public.waitlist;

-- Check for specific email
SELECT * FROM public.waitlist WHERE email = 'test@example.com';

-- View signups from last 24 hours
SELECT email, full_name, created_at
FROM public.waitlist
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🛡️ Security Checklist

- [x] Service role key only in server-side code (API routes)
- [x] No service role in client code or git commits
- [x] Environment variables validated at build time
- [x] Email normalization (lowercase, trim)
- [x] SQL injection protection (Supabase handles this)
- [x] UNIQUE constraint prevents duplicate emails
- [x] Graceful error messages (no stack traces to client)
- [x] HTTPS enforced (Vercel default)
- [ ] Rate limiting (optional: add Vercel protection)
- [ ] CAPTCHA (optional: add if spam becomes an issue)

---

## 🚨 Troubleshooting

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE"

**Solution**: Add environment variables to `.env.local` or Vercel

### Error: "Database error" (500)

**Solution**: 
1. Verify SQL migration ran successfully
2. Check Supabase credentials are correct
3. Check Supabase project is not paused

### Error: "Already registered" not showing for duplicates

**Solution**: Verify UNIQUE constraint exists:

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'waitlist' AND constraint_type = 'UNIQUE';
```

### Form submits but no redirect

**Solution**: 
1. Check browser console for errors
2. Verify `/waitlist/success` page exists
3. Check network tab for API response

---

## 📱 LinkedIn Post Template

```
Synqra is entering early access.

Eight months of chaos finally clicked—automation, speed, and simplicity now feel real.

We're opening a small pilot for founders, creators, and teams who want real leverage: faster creation, smarter automation, zero fluff.

Join the first 50 (Founder Access perks + priority onboarding):
👉 https://waitlist.getluxgrid.com

#Synqra #NOID #AIBuilder #Automation #SaaS #StartupLife #TorontoTech
```

---

## 📈 Optional: Analytics Integration

Add tracking to `app/api/waitlist/route.ts` after successful insert:

```typescript
// After successful insert (line ~60)
if (process.env.NODE_ENV === 'production') {
  // PostHog, Mixpanel, Segment, etc.
  await fetch('https://your-analytics-endpoint.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'waitlist_joined',
      properties: { 
        email: cleanEmail,
        timestamp: new Date().toISOString()
      }
    })
  }).catch(console.error); // Don't fail user flow if analytics fails
}
```

---

## 📞 Support

- **Email**: support@noidlabs.com
- **Issues**: Create an issue in this repo
- **Docs**: https://docs.getluxgrid.com

---

**Status**: ✅ Production-ready
**Last Updated**: 2025-11-10
**Version**: 1.0.0
