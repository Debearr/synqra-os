# Synqra OS Production Deployment Runbook

## Overview

Synqra OS is deployed from the `main` branch using the GitHub Actions workflow defined in `.github/workflows/deployment.yml`. This runbook documents the standard operating procedure for preparing, building, and deploying the production artifact.

## Prerequisites

- Node.js 20.x LTS
- npm 10.x
- Access to the Synqra OS repository with rights to trigger GitHub workflows
- Environment secrets configured in the repository (`SYNQRA_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.)

## Pre-Deployment Checklist

1. Sync `main` with the latest changes.
2. Run `npm run check` inside `noid-dashboard` to lint and type-check the project.
3. Ensure `noid-dashboard/app/manifest.json` and icons in `noid-dashboard/public` are up-to-date.
4. Update version numbers or release notes as required.

## Deployment Steps

1. From the repository root, execute `node fix-deployment-blockers.js` to enforce configuration consistency.
2. Run `npm run ci` inside `noid-dashboard` to perform the production build locally (optional but recommended).
3. Commit and push changes to `main`.
4. Monitor the `Synqra Production Deployment` workflow in GitHub Actions. The workflow performs `npm ci`, `npm run check`, and `npm run build`.
5. After the workflow succeeds, promote the `.next` build artifact to the target environment (Vercel, container image, etc.).

## Rollback Procedure

1. Identify the last known good commit hash from the GitHub Actions history.
2. Create a revert commit (`git revert <hash>`) or redeploy the prior artifact.
3. Trigger the deployment workflow manually (`workflow_dispatch`) to redeploy the previous version.

## Troubleshooting

- **Build fails locally**: Run `npm run prepare:deployment` to re-apply configuration fixes, then retry `npm run ci`.
- **TypeScript errors**: Resolve the reported issues and rerun `npm run type-check`.
- **Missing environment variables**: Verify repository secrets and organization-level variables.
- **Manifest or icons missing**: Regenerate icons via `python tools/create_icons.py` (if available) or re-run the blocker fix script.

## Support

Contact the Synqra Platform team via Slack (`#synqra-platform`) or email `platform@synqra.com` for assistance.
