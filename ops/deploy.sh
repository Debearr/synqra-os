#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-/opt/synqra/ops/synqra.deploy.env}"
# shellcheck disable=SC1090
source "$DEPLOY_ENV_FILE"

TG="/opt/synqra/synqra-os/ops/telegram.sh"
HC="/opt/synqra/synqra-os/ops/healthcheck.sh"

PASS=()
FAIL=()

ok() { PASS+=("$1"); echo "PASS: $1"; }
bad() { FAIL+=("$1"); echo "FAIL: $1"; }

summary() {
  echo
  echo "========== DEPLOY SUMMARY =========="
  for i in "${PASS[@]:-}"; do echo "✅ $i"; done
  for i in "${FAIL[@]:-}"; do echo "❌ $i"; done
  echo "===================================="
  echo
}

on_err() {
  local code=$?
  bad "Deploy aborted (exit $code)"
  summary
  "$TG" "❌ Synqra Deploy FAIL (exit $code)\nHost: $(hostname)\nRepo: ${REPO_ROOT}\nCheck: journalctl -u synqra-mvp -n 200 --no-pager"
  exit "$code"
}
trap on_err ERR

require_file() {
  local f="$1"
  [[ -f "$f" ]] || { echo "Missing file: $f"; exit 1; }
}

validate_env() {
  require_file "$APP_ENV_FILE"
  require_file "$DEPLOY_ENV_FILE"

  local required=(REPO_ROOT APP_DIR APP_ENV_FILE PORT OLLAMA_URL APP_HEALTH_URL)
  for k in "${required[@]}"; do
    if [[ -z "${!k:-}" ]]; then
      echo "Missing value in deploy env: $k"
      exit 1
    fi
  done

  if [[ "${TELEGRAM_BOT_TOKEN:-}" =~ ^[[:space:]]+$ ]]; then
    echo "TELEGRAM_BOT_TOKEN is whitespace-only (set empty or valid token)."
    exit 1
  fi
  if [[ "${TELEGRAM_CHAT_ID:-}" =~ ^[[:space:]]+$ ]]; then
    echo "TELEGRAM_CHAT_ID is whitespace-only (set empty or valid chat id)."
    exit 1
  fi
}

cd "$REPO_ROOT"
ok "Repo root OK ($REPO_ROOT)"

validate_env
ok "Env validated (deploy + app env present)"

command -v node >/dev/null
command -v pnpm >/dev/null
ok "node + pnpm present"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "WARN: Working tree not clean. Deploy will continue."
else
  ok "Git working tree clean"
fi

"$TG" "🚀 Synqra Deploy started\nHost: $(hostname)\nBranch: $(git rev-parse --abbrev-ref HEAD)\nCommit: $(git rev-parse --short HEAD)"

git fetch --all --prune
git pull --ff-only
ok "Git pull OK"

pnpm -w install --frozen-lockfile
ok "pnpm install OK"

pnpm -w exec -- npx tsc --noEmit
ok "tsc --noEmit OK"

pnpm -w --filter synqra-mvp build
ok "build synqra-mvp OK"

sudo systemctl daemon-reload
sudo systemctl restart synqra-mvp
ok "systemd restart synqra-mvp OK"

DEPLOY_ENV_FILE="$DEPLOY_ENV_FILE" sudo -E bash "$HC"
ok "healthcheck OK"

summary
"$TG" "✅ Synqra Deploy PASS\nHost: $(hostname)\nCommit: $(git rev-parse --short HEAD)\nService: synqra-mvp\nHealth: OK"
