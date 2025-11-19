# Railway Deployment Checklist

## Pre-Deployment Verification
- [ ] `nixpacks.toml` uses `nodejs_20`
- [ ] No `railway.json`, `Dockerfile`, or `.dockerignore` files
- [ ] Start script: `next start -p ${PORT:-3000} --hostname 0.0.0.0`
- [ ] Root directory correctly set in Railway dashboard
- [ ] All changes tested locally

## Deployment Configuration
- [ ] **Builder**: Nixpacks (not Docker)
- [ ] **Node Version**: 20.x
- [ ] **Port Binding**: ${PORT} variable
- [ ] **Monorepo Path**: apps/syngra-mvp

## Post-Deployment Check
- [ ] Build logs show `setup │ pkgs: nodejs_20`
- [ ] No Docker `stage-0` stages in logs
- [ ] No Node 18 deprecation warnings
- [ ] App responds on correct port

## Emergency Rollback Plan
If deployment fails:
1. Check Railway build logs for Docker fallback
2. Verify root directory setting
3. Clear build cache if needed
4. Redeploy from last stable commit
