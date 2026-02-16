#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-/opt/synqra/ops/synqra.deploy.env}"
# shellcheck disable=SC1090
source "$DEPLOY_ENV_FILE"

msg="${1:-}"
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "WARN: Telegram not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID empty). Skipping notify."
  exit 0
fi

if [[ -z "$msg" ]]; then
  echo "WARN: Empty telegram message. Skipping."
  exit 0
fi

curl -fsS --max-time 10 \
  -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=${msg}" \
  -d "disable_web_page_preview=true" >/dev/null
