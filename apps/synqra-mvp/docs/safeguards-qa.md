# Safeguards QA Checklist (Fortune-500 Ready)

Use this to verify safeguards behavior quickly without adding deps. Run with the Next server up (e.g., `PORT=3004 pnpm dev:3004`).

## Smoke (basic happy-path)
1. `BASE_URL=http://localhost:3004 pnpm dlx tsx apps/synqra-mvp/scripts/safeguards-smoke.ts`
2. Confirm each case prints status, safe message, and correlationId.
3. Publish and retention tests should show `safeguardTriggered: false` when env caps are at defaults.

## Stress (rapid calls)
1. Run the smoke script twice in parallel:  
   `BASE_URL=http://localhost:3004 pnpm dlx tsx apps/synqra-mvp/scripts/safeguards-smoke.ts & BASE_URL=http://localhost:3004 pnpm dlx tsx apps/synqra-mvp/scripts/safeguards-smoke.ts`
2. Ensure correlationIds are unique and no request hangs; errors must return JSON with a safe message.

## Kill switch verification
1. Start server with `SAFEGUARDS_ENABLED=true SAFEGUARDS_GLOBAL_KILL=true pnpm dev:3004`.
2. Run smoke script; expect 503s and friendly “temporarily paused” messaging for each call.

## Cap verification
1. Start server with `SAFEGUARDS_MAX_REQ_COST_USD=0.00001 SAFEGUARDS_FAIL_CLOSED=true pnpm dev:3004`.
2. Run smoke script; publish/approve should return 429 with budget-friendly safe messaging and correlationId logged.

## Failure-mode verification
1. Run smoke with missing Supabase envs (default dev state).  
   Approve/retention should return structured errors (no HTML/stack traces), with correlationId present.
2. Trigger validation errors (e.g., remove `platforms` from publish body) and confirm 400 responses include safe messages.

## “No silent fail” verification
1. Check server logs for `railway.webhook`, `publish`, `approve`, `onboard-extract/confirm`, `retention`, and `driver-intel` entries; each request should emit start + success/error logs with correlationId.
2. Ensure 4xx/5xx responses always include `error` or `message` plus `correlationId`.

## Lint (non-interactive)
- Use `CI=1 pnpm lint` to avoid prompts. If ESLint suggests fixes, rerun with `pnpm lint -- --fix --no-warn-ignored` for a non-interactive pass.
