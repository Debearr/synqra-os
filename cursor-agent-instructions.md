# Cursor Agent Deployment Instructions

## MANDATORY CHECKS BEFORE ANY DEPLOYMENT CHANGE
1. **Context Validation**
   - Am I in the correct app directory? (apps/synqra-mvp)
   - Is this the main branch? (suggest feature branch if yes)
   - Are there any legacy deployment configs? (delete if found)

2. **Configuration Standards**
   - nixpacks.toml MUST use `nodejs_20`
   - Start script MUST use `${PORT}` binding
   - NO Dockerfile, railway.json, or .dockerignore allowed

3. **Railway Integration**
   - Root directory MUST be set in Railway dashboard
   - Builder MUST be Nixpacks
   - Build logs MUST show `nodejs_20`

## AUTO-FIX HEURISTICS
- **Node 18 detected** → Replace with nodejs_20
- **Docker config found** → Delete and use nixpacks.toml
- **Wrong start script** → Fix PORT binding
- **Wrong directory** → Suggest cd to correct path

## PROTECTION MECHANISMS
- Never override stable main branch code
- Always verify deployment state before suggesting fixes
- Check build logs for Docker fallback
- Ensure monorepo structure respected
