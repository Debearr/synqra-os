# Standard Operating Procedures

## Deploy
- Build: `npm run build` or `pnpm build`
- Start: `npm run start` (port 3004 default, uses $PORT env if set)
- Verify: Check `/api/health` returns 200 OK
- Platform-specific:
  - **Railway**: Procfile auto-starts, uses railway.json config
  - **Vercel**: Auto-deploys from git, uses vercel.json rewrites

## Rollback
- **Railway**: Use Railway CLI or dashboard to revert to previous deployment
- **Vercel**: Use `vercel rollback` or dashboard to restore previous version
- **Manual**: Revert git commit and redeploy

## Maintenance
- Health checks: `/api/health` (liveness) and `/api/ready` (readiness)
- Logs: Located in `/infra/logs/{app,infra,fallback}`
- Monitoring: Dashboards and alerts config in `/infra/monitoring/`
- Scaling: Auto-scale rules and thresholds in `/infra/scaling/`
- Regular tasks:
  - Review logs weekly
  - Update dependencies monthly
  - Test health endpoints after each deploy
