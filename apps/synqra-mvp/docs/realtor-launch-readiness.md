# Realtor MVP Launch Readiness Notes

## Asset Lifecycle (Current Behavior)
- Storage backend: Supabase Storage bucket `synqra-media` (private).
- Agent logos:
  - Stored under `realtor/onboarding/{user_id}/`.
  - Retained until replaced by user action or manual deletion.
- Generated assets:
  - Stored under `realtor/users/{user_id}/assets/{job_id}/`.
  - Delivered only through signed URLs with 24-hour expiry.
  - URL expiry does not delete stored objects.

## Retention and Cleanup
- Current retention: objects remain in storage until explicitly removed.
- Future cleanup job (planned, not scheduled yet):
  - Target path: `realtor/users/*/assets/*`.
  - Recommended policy: delete assets older than 30 days.
  - Trigger: background cron/worker task to be added in a later block.

## Preflight Checklist (Run Before Production Onboarding)
- Command: `pnpm test:realtor-preflight`
- Checks included:
  - Environment variable resolution for Supabase keys/URL.
  - Public client env readiness (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - Pilot allowlist readiness (`PILOT_ALLOWLIST_EMAILS` / `PILOT_ALLOWLIST_USER_IDS`, max users 5-10).
  - Billing env readiness (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`).
  - Storage bucket presence and privacy (`synqra-media` exists and is private).
  - Google OAuth provider readiness via Supabase authorize endpoint redirect behavior.
