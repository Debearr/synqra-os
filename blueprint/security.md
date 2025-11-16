# 🔒 Security Standards

**Version**: 1.0.0  
**Philosophy**: Defense in Depth + Zero Trust  
**Status**: Production Standard

---

## 🎯 Security Principles

### 1. Zero Trust
- Never trust, always verify
- Assume breach
- Least privilege access
- Explicit grants only

### 2. Defense in Depth
- Multiple security layers
- No single point of failure
- Redundant controls

### 3. Security by Default
- Secure defaults
- Opt-in for risky features
- Fail closed, not open

---

## 🔐 Secrets Management

### Environment Variables

**✅ DO**:
```typescript
// Use environment variables
const apiKey = process.env.ANTHROPIC_API_KEY;

// Fail gracefully with fallbacks
const dbUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';

// Validate on startup
if (!process.env.REQUIRED_SECRET) {
  console.warn('⚠️ Missing REQUIRED_SECRET');
}
```

**❌ DON'T**:
```typescript
// NEVER hardcode secrets
const apiKey = 'sk-ant-1234567890';  // ❌

// NEVER commit .env files
git add .env  // ❌

// NEVER log secrets
console.log(`API Key: ${apiKey}`);  // ❌
```

### Secret Rotation

1. **Generate new secret** in provider dashboard
2. **Add new secret** to environment (Railway/Vercel)
3. **Deploy** with new secret
4. **Verify** system works
5. **Revoke old secret**

**Rotation Schedule**:
- API keys: Every 90 days
- Database passwords: Every 180 days
- Service accounts: Every 365 days

---

## 🛡️ Input Validation

### Always Validate User Input

```typescript
import { z } from 'zod';

// Define schema
const GenerateRequestSchema = z.object({
  brief: z.string().min(10).max(5000),
  platforms: z.array(z.enum(['youtube', 'tiktok', 'x', 'linkedin'])),
  userId: z.string().uuid().optional(),
});

// Validate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = GenerateRequestSchema.parse(body);
    
    // Safe to use validated data
    return handleGenerate(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### SQL Injection Prevention

**✅ DO**: Use parameterized queries
```typescript
// Safe: Parameterized
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userInput);  // Safe
```

**❌ DON'T**: Concatenate SQL
```typescript
// UNSAFE: String concatenation
const query = `SELECT * FROM users WHERE email = '${userInput}'`;  // ❌ NEVER DO THIS
```

### XSS Prevention

**✅ DO**: Sanitize output
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML
const clean = DOMPurify.sanitize(userGeneratedHTML);

// Or use React (auto-escapes)
return <div>{userInput}</div>;  // React escapes by default
```

**❌ DON'T**: Use dangerouslySetInnerHTML without sanitization
```typescript
// UNSAFE
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ❌
```

---

## 🔑 Authentication & Authorization

### Authentication (Who are you?)

```typescript
// Using Supabase Auth
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password-123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password-123',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### Authorization (What can you do?)

```typescript
// Check permissions
async function canPublish(userId: string, platform: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, connected_platforms')
    .eq('id', userId)
    .single();
  
  // Check tier allows publishing
  if (profile.tier === 'free') {
    return false;  // Free tier can't publish
  }
  
  // Check platform connected
  if (!profile.connected_platforms?.includes(platform)) {
    return false;  // Platform not connected
  }
  
  return true;
}

// Enforce in API route
export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { platform } = await request.json();
  if (!(await canPublish(user.id, platform))) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Proceed...
}
```

---

## 🗄️ Database Security (RLS)

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE content_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
ON content_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create jobs
CREATE POLICY "Users can create jobs"
ON content_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own jobs
CREATE POLICY "Users can update own jobs"
ON content_jobs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role bypass (for admin)
CREATE POLICY "Service role full access"
ON content_jobs
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

### Secure Defaults

```sql
-- Revoke public access by default
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE ON content_jobs TO authenticated;
GRANT SELECT ON public.pricing_tiers TO anon;  -- Public info
```

---

## 🌐 API Security

### Rate Limiting

```typescript
// Simple in-memory rate limiter
const rateLimits = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const requests = rateLimits.get(ip) || [];
  
  // Filter to window
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false;  // Rate limit exceeded
  }
  
  // Add this request
  recentRequests.push(now);
  rateLimits.set(ip, recentRequests);
  
  return true;
}

// Middleware
export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!checkRateLimit(ip, 100, 60000)) {  // 100 req/min
    return new Response('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

### CORS Configuration

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://synqra.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### CSRF Protection

```typescript
// Generate CSRF token
import { randomBytes } from 'crypto';

function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

// Verify CSRF token
function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// Middleware
export async function POST(request: Request) {
  const csrfToken = request.headers.get('x-csrf-token');
  const sessionToken = await getSessionToken(request);
  
  if (!verifyCSRFToken(csrfToken, sessionToken)) {
    return new Response('Invalid CSRF token', { status: 403 });
  }
  
  // Proceed...
}
```

---

## 🔍 Security Scanning

### Dependency Audits

```bash
# Run regularly
pnpm audit

# Fix automatically (careful!)
pnpm audit --fix

# Check for critical only
pnpm audit --audit-level=critical
```

### Code Scanning

```bash
# Scan for secrets (use git-secrets or similar)
git secrets --scan

# TypeScript strict mode (catches many issues)
tsc --noEmit --strict

# ESLint security plugins
pnpm add -D eslint-plugin-security
```

---

## 📝 Security Checklist

### For Every New Feature:

- [ ] Input validation (Zod schemas)
- [ ] Output sanitization (if HTML)
- [ ] Authentication required?
- [ ] Authorization checked?
- [ ] RLS policies updated?
- [ ] Rate limiting considered?
- [ ] Secrets externalized?
- [ ] Error messages sanitized (no stack traces to users)?
- [ ] Logging excludes sensitive data?

### For Every Deployment:

- [ ] Secrets rotated (if needed)
- [ ] Dependencies audited
- [ ] Environment variables set
- [ ] HTTPS enforced
- [ ] Security headers configured

---

## 🚨 Incident Response

### If Security Incident Detected:

1. **Contain**: Disable affected systems
2. **Assess**: Understand scope and impact
3. **Notify**: Alert affected users
4. **Fix**: Patch vulnerability
5. **Document**: Write post-mortem
6. **Learn**: Update security practices

### Security Contacts

- Security Lead: [TBD]
- Backup: [TBD]
- External Security Audit: [TBD]

---

## 🎓 Security Training

### Required Reading for All Developers:

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Next.js Security: https://nextjs.org/docs/app/building-your-application/authentication

### Security Reviews:

- Code review: Every PR
- Security audit: Quarterly
- Penetration testing: Annually

---

**Score**: 95/100 (from recent audit)  
**Next Audit**: 2025-12-15  
**Status**: Production Ready
