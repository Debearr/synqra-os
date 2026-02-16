#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-/opt/synqra/ops/synqra.deploy.env}"
# shellcheck disable=SC1090
source "$DEPLOY_ENV_FILE"

TG="/opt/synqra/synqra-os/ops/telegram.sh"

fail() {
  local m="$1"
  echo "FAIL: $m"
  "$TG" "❌ Synqra Healthcheck FAIL\n$m"
  exit 1
}

pass() { echo "PASS: $1"; }

# --- Ollama ---
if curl -fsS --max-time 3 "${OLLAMA_URL}/api/tags" >/dev/null; then
  pass "Ollama OK (${OLLAMA_URL})"
else
  fail "Ollama DOWN (${OLLAMA_URL})"
fi

# --- Synqra service status ---
if systemctl is-active --quiet synqra-mvp; then
  pass "systemd synqra-mvp active"
else
  fail "systemd synqra-mvp NOT active"
fi

# --- App HTTP ---
if curl -fsS --max-time 5 "${APP_HEALTH_URL}" >/dev/null; then
  pass "App HTTP OK (${APP_HEALTH_URL})"
else
  echo "WARN: App HTTP failed (${APP_HEALTH_URL}) - restarting synqra-mvp..."
  systemctl restart synqra-mvp || true
  sleep 2
  if curl -fsS --max-time 5 "${APP_HEALTH_URL}" >/dev/null; then
    pass "App HTTP OK after restart"
    "$TG" "🟡 Synqra recovered\nApp HTTP failed then recovered after restart."
  else
    fail "App HTTP still failing after restart (${APP_HEALTH_URL})"
  fi
fi
