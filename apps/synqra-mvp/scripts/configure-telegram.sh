#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/synqra/synqra-mvp.env}"
APP_DIR="${APP_DIR:-/opt/synqra/synqra-os}"
SERVICE_NAME="${SERVICE_NAME:-synqra-mvp}"

BOT_TOKEN="${BOT_TOKEN:-${1:-}}"
CHAT_ID="${CHAT_ID:-${2:-}}"
TEST_MESSAGE="${TEST_MESSAGE:-Telegram integration test succeeded}"

if [[ -z "${BOT_TOKEN}" || -z "${CHAT_ID}" ]]; then
  echo "Usage:"
  echo "  BOT_TOKEN=<token> CHAT_ID=<chat_id> bash scripts/configure-telegram.sh"
  echo "  or"
  echo "  bash scripts/configure-telegram.sh <bot_token> <chat_id>"
  exit 1
fi

if [[ "${BOT_TOKEN}" == "PASTE_NEW_BOT_TOKEN_HERE" ]]; then
  echo "BOT_TOKEN is still the placeholder value."
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root (sudo)."
  exit 1
fi

mkdir -p "$(dirname "${ENV_FILE}")"
touch "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

backup="${ENV_FILE}.$(date +%Y%m%d_%H%M%S).bak"
cp "${ENV_FILE}" "${backup}"

upsert_env() {
  local key="$1"
  local value="$2"
  local file="$3"
  if grep -q "^${key}=" "${file}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${file}"
  else
    echo "${key}=${value}" >> "${file}"
  fi
}

upsert_env "TELEGRAM_BOT_TOKEN" "${BOT_TOKEN}" "${ENV_FILE}"
upsert_env "TELEGRAM_CHAT_ID" "${CHAT_ID}" "${ENV_FILE}"

echo "Updated ${ENV_FILE} (backup: ${backup})"

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "^${SERVICE_NAME}"; then
  systemctl restart "${SERVICE_NAME}"
  systemctl is-active --quiet "${SERVICE_NAME}"
  echo "Service restarted via systemd: ${SERVICE_NAME}"
else
  pkill -f "next start" || true
  cd "${APP_DIR}"
  nohup pnpm --filter synqra-mvp start >/tmp/synqra-app.log 2>&1 &
  sleep 5
  echo "Service started via pnpm fallback (log: /tmp/synqra-app.log)"
fi

response="$(curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "text=${TEST_MESSAGE}")"

if echo "${response}" | grep -q '"ok":true'; then
  echo "PASS: Telegram test message sent."
else
  echo "FAIL: Telegram API call did not return ok=true"
  echo "Response: ${response}"
  exit 1
fi

echo "Setup complete."
