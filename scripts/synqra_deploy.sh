#!/usr/bin/env bash
set -euo pipefail

# Unified Synqra Deploy Flow
# Steps:
# 1) Verify deployment logs and probe URL (no auto-open here to avoid duplicates)
# 2) Fetch live URL
# 3) Auto-open in browser
# 4) Update README with live URL and commit + push
#
# Env (optional):
# - RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT
# - RAILWAY_SERVICE_NAME (default: synqra-os)
# - README_PATH (default handled by update script)

have_cmd() { command -v "$1" >/dev/null 2>&1; }

SERVICE_NAME=${RAILWAY_SERVICE_NAME:-synqra-os}

ensure_cli() {
  if have_cmd railway; then
    return 0
  fi
  echo "[deploy] Railway CLI not found; using npx wrapper for commands"
}

railway_login_if_token() {
  if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
    echo "[deploy] Logging in to Railway via token"
    npx -y @railway/cli login --token "$RAILWAY_TOKEN" >/dev/null 2>&1 || true
  fi
}

fetch_live_url() {
  # Prefer jq if available; else use node to parse JSON
  if have_cmd jq; then
    npx -y @railway/cli status --json 2>/dev/null | jq -r '.url // empty' | sed 's/\r$//'
    return 0
  fi
  npx -y @railway/cli status --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);if(j&&j.url)process.stdout.write(String(j.url))}catch(e){process.exit(1)}})"
}

open_in_browser() {
  local url="$1"
  if [[ -z "$url" ]]; then
    echo "[deploy] No URL to open" >&2
    return 0
  fi
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 && echo "[deploy] 🌍 Opened in browser (open)" && return 0
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 && echo "[deploy] 🌍 Opened in browser (xdg-open)" && return 0
  fi
  if command -v start >/dev/null 2>&1; then
    start "$url" >/dev/null 2>&1 && echo "[deploy] 🌍 Opened in browser (start)" && return 0
  fi
  echo "[deploy] ⚠️ Could not auto-open browser. URL: $url"
}

main() {
  echo "[deploy] Starting Synqra deployment verification..."
  ensure_cli
  railway_login_if_token

  echo "[deploy] Step 1/4: Verify logs and probe URL"
  NO_OPEN=1 /workspace/scripts/verify_deploy.sh || true

  echo "[deploy] Step 2/4: Fetch live URL"
  local url
  url=$(fetch_live_url || true)
  if [[ -z "$url" || ! "$url" =~ ^https?:// ]]; then
    echo "[deploy] ❌ Could not fetch live Synqra URL" >&2
    exit 1
  fi
  echo "[deploy] ✅ Synqra live at: $url"

  echo "[deploy] Step 3/4: Open in browser"
  open_in_browser "$url" || true

  echo "[deploy] Step 4/4: Update README and commit/push"
  COMMIT=1 /workspace/scripts/update_readme_live_url.sh || true

  echo "[deploy] 🚀 Deployment flow complete."
}

main "$@"

