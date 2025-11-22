# Phase 3: Backend Integration — Diff Review

**Ready for Approval:** All changes are isolated to `apps/synqra-mvp/*` and `supabase/*`

---

## 📊 Change Summary

| Type | Count | Lines | Location |
|------|-------|-------|----------|
| **New Files** | 3 | ~625 | apps/synqra-mvp/, supabase/ |
| **Modified Files** | 1 | ~50 | apps/synqra-mvp/ |
| **Total Changes** | 4 files | ~675 lines | Isolated to requested paths |

---

## 📁 Files Changed

### ✅ NEW FILES (3)

#### 1. `/supabase/migrations/20251122_pilot_applications.sql`
**Purpose:** Database schema for pilot applications  
**Lines:** ~155

**Key Features:**
- Creates `pilot_applications` table
- 7 form fields + status tracking + metadata
- Row Level Security (RLS) policies
- Unique index on email (duplicate prevention)
- Auto-updating timestamps
- Ready for Phase 4 payment fields

**Schema:**
```sql
CREATE TABLE pilot_applications (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  company_size TEXT NOT NULL CHECK(...),
  linkedin_profile TEXT,
  why_pilot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ NOT NULL,
  payment_link TEXT,  -- Phase 4
  metadata JSONB,
  ...
);
```

---

#### 2. `/apps/synqra-mvp/app/api/pilot/apply/route.ts`
**Purpose:** API endpoint for pilot applications  
**Lines:** ~175

**Key Features:**
- **POST** - Submit application
  - Server-side Zod validation
  - Duplicate email detection
  - Supabase insert
  - Email notifications (async)
  - Error handling

- **GET** - Check application status
  - Query by email
  - Returns status & applied date

**Error Codes:**
- `400` - Validation failed
- `409` - Duplicate application
- `500` - Server error

**Example:**
```typescript
export async function POST(req: Request) {
  // 1. Validate with Zod
  const validationResult = pilotApplicationSchema.safeParse(body);
  
  // 2. Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from('pilot_applications')
    .select('email')
    .eq('email', email)
    .single();
  
  // 3. Insert into database
  const { data, error } = await supabaseAdmin
    .from('pilot_applications')
    .insert([{ ...data }]);
  
  // 4. Send emails (async)
  Promise.all([
    sendApplicantConfirmation(...),
    sendAdminNotification(...)
  ]);
  
  // 5. Return success
  return NextResponse.json({ ok: true, data });
}
```

---

#### 3. `/apps/synqra-mvp/lib/email/notifications.ts`
**Purpose:** Email notification system  
**Lines:** ~310

**Key Features:**
- `sendApplicantConfirmation()` - Confirmation email
- `sendAdminNotification()` - Alert admin of new application
- Beautiful HTML templates with Synqra branding
- SMTP configuration from `.env`
- Graceful fallback (logs if SMTP not configured)

**Email Templates:**

**Applicant Email:**
```
Subject: Application Received — Synqra Founder Pilot

Hi [Name],

Thank you for applying to the Synqra Founder Pilot...

What Happens Next:
1. Team reviews within 24 hours
2. Check email for approval + payment link
3. Complete payment to secure spot
4. Receive onboarding instructions
```

**Admin Email:**
```
Subject: 🚀 New Pilot Application: [Name] ([Company])

[All form data formatted]

Next Steps:
1. Review in Supabase dashboard
2. Approve/Reject within 24 hours
3. System will send payment link (Phase 4)
```

**Note:** Currently logs to console. Uncomment nodemailer code to send real emails.

---

### ✏️  MODIFIED FILES (1)

#### 4. `/apps/synqra-mvp/components/forms/PilotApplicationForm.tsx`
**Changes:** Updated `handleSubmit()` function (~50 lines)

**Before (Phase 2):**
```typescript
const handleSubmit = async (e: FormEvent) => {
  // Client-side validation only
  const validatedData = pilotApplicationSchema.parse(formData);
  
  // Log and redirect (no API call)
  console.log('[Pilot Application] Validated:', validatedData);
  await new Promise(resolve => setTimeout(resolve, 500));
  router.push('/pilot/apply/success');
};
```

**After (Phase 3):**
```typescript
const handleSubmit = async (e: FormEvent) => {
  // Client-side validation
  const validatedData = pilotApplicationSchema.parse(formData);
  
  // API call
  const response = await fetch('/api/pilot/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedData),
  });
  
  const result = await response.json();
  
  // Handle errors
  if (!response.ok) {
    if (result.error === 'duplicate_application') {
      setErrors({ email: 'You have already applied...' });
      return;
    }
    if (result.error === 'validation_failed') {
      // Map server errors to form fields
      setErrors(mapServerErrors(result.details));
      return;
    }
    throw new Error(result.message);
  }
  
  // Success
  console.log('[Pilot Application] Success:', result.data.id);
  router.push('/pilot/apply/success');
};
```

**Key Changes:**
- ✅ Real API call instead of mock
- ✅ Server-side validation
- ✅ Duplicate detection
- ✅ Better error handling
- ✅ Error mapping to form fields
- ✅ Database persistence

---

## 🔍 Detailed Diff

### Modified: PilotApplicationForm.tsx

```diff
@@ -16,9 +16,12 @@ import { pilotApplicationSchema, type PilotApplicationData } from '@/lib/validat
  * - Form input height 56px, soft 8px radius
  * - Colors: matte black #0A0A0A, warm ivory #F5F3F0, gold accent #C5A572, teal highlight #2DD4BF
  * 
- * Functionality:
+ * Functionality (Phase 3):
  * - Client-side validation with Zod
- * - No Supabase/Stripe integration (Phase 2)
+ * - API integration with /api/pilot/apply
+ * - Supabase backend storage
+ * - Email notifications (applicant + admin)
+ * - Duplicate detection
  * - Success redirect to /pilot/apply/success
  */

@@ -58,28 +61,65 @@ export default function PilotApplicationForm() {
     setIsSubmitting(true);
 
     try {
-      // Validate form data with Zod
+      // Validate form data with Zod (client-side)
       const validatedData = pilotApplicationSchema.parse(formData);
       
-      // Log to console for Phase 2 (no backend integration yet)
-      console.log('[Pilot Application] Validated data:', validatedData);
+      // Submit to API (Phase 3: Backend Integration)
+      const response = await fetch('/api/pilot/apply', {
+        method: 'POST',
+        headers: {
+          'Content-Type': 'application/json',
+        },
+        body: JSON.stringify(validatedData),
+      });
+
+      const result = await response.json();
       
-      // Simulate brief processing delay
-      await new Promise(resolve => setTimeout(resolve, 500));
+      if (!response.ok) {
+        // Handle API errors
+        if (result.error === 'duplicate_application') {
+          setErrors({
+            email: 'You have already applied. Check your email for updates.',
+          });
+          return;
+        }
+        
+        if (result.error === 'validation_failed' && result.details) {
+          // Map server validation errors to form fields
+          const fieldErrors: Partial<Record<keyof PilotApplicationData, string>> = {};
+          result.details.forEach((err: any) => {
+            const field = err.path[0] as keyof PilotApplicationData;
+            fieldErrors[field] = err.message;
+          });
+          setErrors(fieldErrors);
+          return;
+        }
+
+        throw new Error(result.message || 'Failed to submit application');
+      }
       
-      // Redirect to success page
+      // Success - redirect to success page
+      console.log('[Pilot Application] Submitted successfully:', result.data.id);
       router.push('/pilot/apply/success');
       
     } catch (error: any) {
+      console.error('[Pilot Application] Submit error:', error);
+      
       if (error.errors) {
-        // Parse Zod validation errors
+        // Parse Zod validation errors (client-side)
         const fieldErrors: Partial<Record<keyof PilotApplicationData, string>> = {};
         error.errors.forEach((err: any) => {
           const field = err.path[0] as keyof PilotApplicationData;
           fieldErrors[field] = err.message;
         });
         setErrors(fieldErrors);
+      } else {
+        // Generic error - show on email field
+        setErrors({
+          email: error.message || 'Failed to submit application. Please try again.',
+        });
       }
+      
       setIsSubmitting(false);
     }
   };
```

---

## 🔒 Security Review

### ✅ Security Features Implemented

1. **Input Validation**
   - ✅ Client-side Zod validation (UX)
   - ✅ Server-side Zod validation (security)
   - ✅ Email normalization (lowercase)

2. **Database Security**
   - ✅ Row Level Security (RLS) enabled
   - ✅ Service role for API (elevated permissions)
   - ✅ Anon users can only INSERT
   - ✅ Parameterized queries (SQL injection protection)

3. **Duplicate Prevention**
   - ✅ Unique index on email (database level)
   - ✅ Pre-insert check (API level)
   - ✅ User-friendly error message

4. **Rate Limiting** (Future)
   - ⚠️ Consider adding for production
   - Recommendation: Vercel Edge Config or Upstash

---

## 🧪 Testing Checklist

### Before Approval

- [ ] Review migration SQL for correctness
- [ ] Check API route error handling
- [ ] Verify email templates look good
- [ ] Ensure form updates are minimal
- [ ] Confirm no Stripe code added

### After Approval (Deployment)

- [ ] Run Supabase migration
- [ ] Test API endpoint with curl
- [ ] Submit test application via form
- [ ] Verify database insert
- [ ] Check email logs (console)
- [ ] Test duplicate detection
- [ ] Verify error messages display

---

## 📦 Dependencies

### No New Dependencies Required!

All functionality uses existing packages:
- ✅ `@supabase/supabase-js` (already installed)
- ✅ `zod` (already installed)
- ✅ `next` (already installed)

### Optional (for real emails):
```bash
# Only if you want to send real emails now
pnpm add nodemailer @types/nodemailer
```

---

## 🚀 Deployment Steps

### 1. Review This Diff
✅ You're doing this now!

### 2. Approve Changes
```bash
# If approved, I'll commit these changes
git add supabase/migrations/20251122_pilot_applications.sql
git add apps/synqra-mvp/app/api/pilot/
git add apps/synqra-mvp/lib/email/
git add apps/synqra-mvp/components/forms/PilotApplicationForm.tsx
git commit -m "Phase 3: Add backend integration for pilot applications

- Add Supabase migration for pilot_applications table
- Create API endpoint /api/pilot/apply (POST/GET)
- Add email notification system (applicant + admin)
- Update form to call API instead of mock redirect
- Implement duplicate detection and error handling

No Stripe integration (deferred to Phase 4)"
```

### 3. Run Migration
```bash
# Connect to Supabase and run migration
psql -h your-db.supabase.co -U postgres -d postgres \
  -f supabase/migrations/20251122_pilot_applications.sql
```

### 4. Deploy to Railway/Vercel
```bash
# Set environment variables first!
# Then deploy
git push origin main
```

### 5. Test Production
```bash
# Submit test application
curl -X POST https://synqra.com/api/pilot/apply \
  -H "Content-Type: application/json" \
  -d '{ ... test data ... }'
```

---

## ❌ What's NOT Changed

### Files NOT Modified
- ✅ No changes to existing routes (except form component)
- ✅ No changes to homepage (already done in Phase 2)
- ✅ No changes to success page (already done in Phase 2)
- ✅ No changes to validation schema (working perfectly)
- ✅ No Stripe code added
- ✅ No Calendly integration
- ✅ No admin dashboard

### Scope Respected
- ✅ All changes in `apps/synqra-mvp/*`
- ✅ Migration in `supabase/*`
- ✅ No other directories touched
- ✅ No production components modified

---

## ✅ Approval Checklist

Review these before approving:

- [ ] Migration SQL looks correct
- [ ] API endpoint has proper error handling
- [ ] Email templates have correct copy
- [ ] Form changes are minimal and safe
- [ ] No Stripe code (as requested)
- [ ] All changes in correct directories
- [ ] Security features implemented
- [ ] Ready for deployment

---

## 🎯 Summary

**Files Changed:** 4 (3 new, 1 modified)  
**Lines Changed:** ~675  
**Scope:** ✅ apps/synqra-mvp/* and supabase/* only  
**Stripe:** ❌ Not added (as requested)  
**Breaking Changes:** None  
**Ready for:** Deployment

---

## 📋 Next Steps After Approval

1. **I'll commit these changes** with a clear message
2. **You run the migration** on Supabase
3. **You deploy** to Railway/Vercel
4. **Test** the production flow
5. **Monitor** for errors
6. **Phase 4** when ready (Stripe + admin dashboard)

---

**Awaiting your approval to proceed with commit!** 🚀

Type "approved" or let me know if you want any changes.

---

*Built by NØID Labs × Cursor AI*  
*"Drive Unseen. Earn Smart."*
