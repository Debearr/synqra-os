# Deployment Guardrails

## Pre-Flight Checklist
1. ✅ Verify current directory: `pwd` should be app root
2. ✅ Check nixpacks.toml: Must specify `nodejs_20`
3. ✅ Validate start script: Uses `${PORT}` binding
4. ✅ Remove legacy files: No Dockerfile, railway.json

## Railway-Specific Rules
- Root Directory MUST be set in Railway dashboard
- Builder MUST be Nixpacks (not Docker)
- Build logs MUST show `nodejs_20`, not `nodejs_18`
- NO Docker `stage-0` stages allowed

## Emergency Procedures
### If Docker Detected:
1. Check for hidden `.railway` directory
2. Verify root directory setting
3. Clear build cache in Railway
4. Force redeploy with cache bust

### If Node 18 Detected:
1. Verify nixpacks.toml nodejs_20
2. Check for cached build layers
3. Use emergency cache bust file
4. Manual redeploy if needed
