# Synqra Deployment Final Setup Guide

## 1. Prerequisites
- Node.js 18+ and npm 10+
- Access to Supabase service role key and project URL
- Access to the n8n automation webhook

## 2. Environment Variables
- Duplicate `.env.template` to `.env` locally and fill in the secrets.
- In GitHub Actions, map the same keys (`LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN`, `POST_AS`, `TIMEZONE`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `N8N_WEBHOOK_URL`) to repository secrets so workflow runs can hydrate them automatically.

## 3. Install Dependencies
- Root workspace: `npm install`
- Health checks package: `cd scripts/health-checks && npm install`

## 4. Preflight Deployment Fixes
- Run `npm run fix:deployment-blockers` from the repo root.
- The script ensures `.env` parity, hydrates `noid-dashboard/public/favicon.ico`, `site.webmanifest`, and `metadata.json`, and exits with non-zero code if anything is missing.

## 5. Health-Check Verification
- To dry-run the Supabase health monitor, supply temporary env vars:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `N8N_WEBHOOK_URL`
  - Example: `SUPABASE_URL=https://example.com SUPABASE_SERVICE_KEY=dummy N8N_WEBHOOK_URL=https://httpbin.org/post node scripts/health-checks/ping-supabase.mjs`
- With real credentials the script should exit `0` and log to Supabase.

## 6. Build Validation
- Dashboard app: `cd noid-dashboard && npm install && npm run build`
- Health-check app (optional deployment target): `cd scripts/health-checks && npm run build`

## 7. Before Releasing
- Confirm GitHub Actions workflows reference `.env.template` for their `env` matrix or secrets mapping.
- Commit generated public assets (`noid-dashboard/public/favicon.ico`, `site.webmanifest`, `metadata.json`) so the build pipeline does not rely on runtime generation.
- Review `scripts/fix-deployment-blockers.js` output and rerun until all checks pass.
