# Synqra MVP Runbook

This runbook documents the current, verified runtime behavior of `apps/synqra-mvp`.

## 1) Current User Journey

- Canonical flow:
  - `/` redirects to `/enter`
  - `/enter` is the front door
  - accepted access on `/enter` sets `synqra_gate=1` and moves to `/studio`
  - `/studio` requires `synqra_gate=1` or a valid Supabase session cookie
- Production route hardening:
  - `/demo` redirects to `/enter`
  - `/login` redirects to `/enter`

## 2) Health Endpoints

- `GET /api/health/enterprise`
  - Full app health check.
  - Returns `200` when healthy, can return `500`/`503` on degraded or critical conditions.
- `GET /api/health/models`
  - Model subsystem health/status.
  - Returns `200` or `503` depending on model state.
- `GET /api/ready`
  - Readiness probe for traffic.
  - Returns `200` when ready, `503` when not ready.

## 3) Core API Surfaces

- `POST /api/waitlist`
  - Validates JSON object payload.
  - Returns `400` for invalid payloads.
  - Returns `500` for database/config errors.
- `POST /api/pilot/apply`
  - Validates payload with Zod.
  - Returns `400` for invalid payload.
  - Returns `409` for duplicate applications.
  - Returns `500` for server/database errors.
- `POST /api/railway-webhook`
  - Enforces webhook signature verification.
  - Rejects oversized payloads before processing.
  - Enforces replay window checks and duplicate replay fingerprints.
  - Returns `401` for invalid signature.
  - Returns `409` for duplicate replay events.
  - Returns `5xx` for server-side failures (for example kill switch active).

## 4) Worker and Scheduler

Worker code path: `apps/synqra-mvp/services/cloud-run-worker`

- Health endpoint:
  - `GET /health`
- Job endpoints:
  - `POST /jobs/dispatch`
  - `POST /jobs/retry`
  - `POST /jobs/schedule`
  - `POST /jobs/audit`
  - `POST /jobs/email-poll-and-classify`
  - `POST /jobs/high-priority-drafts`
  - `POST /jobs/daily-normal-digest`
- Auth:
  - Job endpoints require bearer auth.
- Fail-fast startup requirements:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `INTERNAL_JOB_SIGNING_SECRET`
  - `INTERNAL_API_BASE_URL`
  - `CLOUD_RUN_SERVICE_URL`
  - In production, `INTERNAL_API_BASE_URL` must not point to localhost.

Scheduler provisioning script:
- `apps/synqra-mvp/services/cloud-run-worker/scheduler-jobs.sh`
- Uses idempotent create/update behavior.
- Applies retry/backoff policy to each cron job.
- Includes cron wiring for:
  - dispatch
  - retry
  - schedule
  - audit
  - email-poll-and-classify
  - high-priority-drafts
  - daily-normal-digest

## 5) Security and Secrets

- No secrets should be hardcoded in source files.
- Use environment variables and secret manager only.
- If any credential-like value is found in git history or code:
  1. rotate and reissue immediately
  2. invalidate old secrets
  3. update all environments
  4. perform history rewrite only if required by policy
- Remediation checklist:
  - `apps/synqra-mvp/docs/SECURITY_REMEDIATION.md`

## 6) Cost Guardrails (Current State)

- Council endpoint (`POST /api/council`) currently enforces:
  - tier-based request limits (prompt length and requests/minute)
  - feature gating by tier (for example FX Signal Hub)
  - provider fallback (OpenRouter first, Gemini fallback)
- Publish/approve flows enforce safeguards budget checks.
- Monitoring and alert bootstrap script:
  - `apps/synqra-mvp/services/cloud-run-worker/monitoring-alerts.sh`
  - Covers worker restarts, p95 latency, scheduler backlog breach, and agent hop breach.
- Current gaps:
  - no strict structured output schema validation for council responses
  - no persisted per-request token-cost ledger for council calls

## 7) Validation Commands

From repo root:

```bash
npx tsc --noEmit
pnpm -C apps/synqra-mvp build
pnpm -C apps/synqra-mvp test:routing
```

For deployment checks:

```bash
bash apps/synqra-mvp/scripts/verify-deployment.sh https://your-host
```
