# synqra-os

## Deployment verification and auto-open

Use the helper script to verify the Railway deployment, print recent logs, probe the public URL, and auto-open the live site.

```bash
scripts/verify_deploy.sh
```

Behavior:
- Attempts to ensure Railway CLI is available and selects context
- Shows recent logs (configurable via `LOG_SINCE`, `LOG_LINES`)
- Derives the public URL via `railway status --service synqra-os --json | jq -r '.url'` (fallbacks to runtime env)
- Probes the URL with `curl`
- Auto-opens the URL in your default browser (`xdg-open`/`open`/`start`)

Environment variables:
- `RAILWAY_TOKEN` (optional)
- `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT`, `RAILWAY_SERVICE_NAME` (default service: `synqra-os`)
- `DEPLOY_URL` or `PUBLIC_URL` (optional manual override)
- `LOG_SINCE` (default `30m`), `LOG_LINES` (default `200`)
- `NO_OPEN=1` to skip opening the browser

Example:
```bash
RAILWAY_SERVICE_NAME=synqra-os scripts/verify_deploy.sh
```

## Auto-update README with live URL

Update the README with the current Railway live URL after each deploy.

```bash
# Auth (optional if already logged in via Railway CLI)
export RAILWAY_TOKEN=<your_token>

# Update README. Set COMMIT=1 to auto-commit and push the change
COMMIT=1 scripts/update_readme_live_url.sh
```

Notes:
- Requires Railway CLI available via `npx` and Node.js at runtime
- If `jq` is not present, Node is used to parse JSON
- Uses current Railway context; ensure the project/env is selected