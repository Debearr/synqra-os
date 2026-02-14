# Production Email Verification Runbook

## Required Environment Variables

- `RESEND_API_KEY`: Resend API key with send permission.
- `FROM_EMAIL`: **Must be a verified sender identity in Resend**. Use either:
  - A verified single sender address, for example `Synqra <pilot@your-verified-domain.com>`.
  - A mailbox on a domain that is fully verified in Resend.
- `ADMIN_EMAIL`: Inbox that receives admin notifications.

If any variable is missing, Synqra endpoints return non-200 and log an explicit error. No SMTP fallback is used.

## Deterministic Protected Test Path

Use `POST /api/internal/email/test` with admin auth (`ADMIN_TOKEN` in body, query, header, or cookie).

Request body:

```json
{
  "adminToken": "YOUR_ADMIN_TOKEN",
  "applicantEmail": "deliverability-check@example.com",
  "fullName": "Email Verification",
  "companyName": "Synqra QA",
  "role": "Founder",
  "companySize": "1-10"
}
```

Expected response:

- `200` with `{ ok: true, data: { applicantEmail } }` when applicant + admin messages both send.
- `502` with `{ ok: false, error: "email_send_failed" }` if either message fails.
- `401/503` when admin auth is invalid or not configured.

## Access Code Approval Flow

- `POST /api/pilot/approve` (admin-only) issues a one-time access code.
- Raw code is emailed to applicant via Resend and stored only as SHA-256 hash in `access_codes`.
- Any email failure returns non-200 and rolls back the issued code.

## Access Code Verification Flow

- `POST /api/access/verify` consumes the code exactly once.
- Verification requires `email + code`, checks unused + unexpired status, sets `used_at`, and returns gate signal metadata.
