# Deployment Discipline

## Production Branch Policy
- Production branch is `main` only.
- Only commits already merged into `main` are eligible for production deployment.

## Branch Hygiene
- All feature and fix branches must be deleted after merge to `main`.
- Do not reuse old feature branches for new production work.

## Clean Tree Requirement
- Do not deploy from a dirty working tree.
- `git status --porcelain` must return no output before deploy.

## Pre-Deploy Checklist
1. Confirm you are on `main`: `git rev-parse --abbrev-ref HEAD`.
2. Pull latest `main` and verify expected SHA: `git rev-parse HEAD`.
3. Confirm redirect/routing config is correct (`next.config.ts`, `vercel.json`).
4. Confirm no merge markers or invalid JSON in config files.
5. Run build from deployment root and ensure it passes.
6. Confirm no untracked/uncommitted files: `git status --porcelain`.
7. Deploy only after all checks pass.

## Rollback Instructions
1. Identify last known good production SHA from `main`.
2. Re-deploy that SHA through Vercel (or revert offending commit on `main` and redeploy).
3. Validate `/`, `/enter`, and `/health` behavior post-rollback.
4. Record incident cause and corrective action in deployment notes.
