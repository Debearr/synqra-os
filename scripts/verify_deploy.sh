#!/usr/bin/env bash
set -euo pipefail

# Verify Railway deployment by tailing recent logs and probing the public URL.
#
# Inputs (environment variables):
# - RAILWAY_TOKEN            (optional) API token for non-interactive auth
# - RAILWAY_PROJECT_ID       (optional) Project to target; if omitted, relies on local context
# - RAILWAY_ENVIRONMENT      (optional) Environment name/ID to target
# - RAILWAY_SERVICE_NAME     (optional) Specific service for logs
# - DEPLOY_URL | PUBLIC_URL  (optional) Public URL to probe; if absent, tries to detect via CLI
# - LOG_LINES                (optional) Default: 200
# - LOG_SINCE                (optional) Default: 30m (e.g., 10m, 1h)

LOG_LINES=${LOG_LINES:-200}
LOG_SINCE=${LOG_SINCE:-30m}

echo "[verify] Starting deployment verification"

have_cmd() { command -v "$1" >/dev/null 2>&1; }

ensure_cli() {
  if have_cmd railway; then
    return 0
  fi
  echo "[verify] Railway CLI not found. Attempting install via npm (@railway/cli)" >&2
  if ! have_cmd npm; then
    echo "[verify] npm is required to install Railway CLI automatically. Skipping CLI features." >&2
    return 1
  fi
  npm -g install @railway/cli >/dev/null 2>&1 || {
    echo "[verify] Failed to install Railway CLI. Continuing without CLI features." >&2
    return 1
  }
  if have_cmd railway; then
    echo "[verify] Railway CLI installed"
    return 0
  fi
  return 1
}

login_cli() {
  if ! have_cmd railway; then return 1; fi
  if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
    # Avoid noisy output if already logged in
    railway login --token "$RAILWAY_TOKEN" >/dev/null 2>&1 || true
  fi
}

select_context() {
  if ! have_cmd railway; then return 1; fi
  local args=()
  if [[ -n "${RAILWAY_PROJECT_ID:-}" ]]; then
    args+=( -p "$RAILWAY_PROJECT_ID" )
  fi
  if [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
    args+=( -e "$RAILWAY_ENVIRONMENT" )
  fi
  if ((${#args[@]})); then
    railway use "${args[@]}" >/dev/null 2>&1 || true
  fi
}

print_logs() {
  if ! have_cmd railway; then
    echo "[verify] Skipping logs: Railway CLI unavailable" >&2
    return 0
  fi
  local args=( logs --since "$LOG_SINCE" --lines "$LOG_LINES" )
  if [[ -n "${RAILWAY_SERVICE_NAME:-}" ]]; then
    args+=( -s "$RAILWAY_SERVICE_NAME" )
  fi
  echo "[verify] Recent logs (since $LOG_SINCE, lines $LOG_LINES):"
  # Best effort: do not fail the whole script on logs
  railway "${args[@]}" || echo "[verify] Warning: failed to fetch logs"
}

derive_url_from_cli() {
  if ! have_cmd railway; then return 1; fi
  # Try to read an env var from the runtime environment that looks like a URL
  # This avoids parsing table output from `railway variables`.
  local candidate
  candidate=$(railway run env 2>/dev/null | grep -E "^(PUBLIC_URL|RAILWAY_URL|APP_URL|URL)=" | head -n1 | cut -d'=' -f2 || true)
  if [[ -n "$candidate" && "$candidate" =~ ^https?:// ]]; then
    echo "$candidate"
    return 0
  fi
  return 1
}

probe_url() {
  local url="${DEPLOY_URL:-${PUBLIC_URL:-}}"
  if [[ -z "$url" ]]; then
    url=$(derive_url_from_cli || true)
  fi
  if [[ -z "$url" ]]; then
    echo "[verify] No DEPLOY_URL provided and could not derive from CLI. Skipping URL probe." >&2
    return 0
  fi
  if ! have_cmd curl; then
    echo "[verify] curl not available; cannot probe $url" >&2
    return 0
  fi
  echo "[verify] Probing URL: $url"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$url" || echo "000")
  echo "[verify] HTTP status: $code"
  if [[ "$code" =~ ^2|3 ]]; then
    echo "[verify] URL is reachable"
  else
    echo "[verify] Warning: non-success status from $url" >&2
  fi
}

main() {
  ensure_cli || true
  login_cli || true
  select_context || true
  print_logs || true
  probe_url || true
  echo "[verify] Done"
}

main "$@"

