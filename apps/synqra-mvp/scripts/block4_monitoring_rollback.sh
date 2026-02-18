#!/usr/bin/env bash

set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-synqra-mvp}"
APP_DIR="${APP_DIR:-$(pwd)}"
LOG_LINES="${LOG_LINES:-400}"
LAST_KNOWN_GOOD_SHA="${LAST_KNOWN_GOOD_SHA:-}"
FALLBACK_ALERT_THRESHOLD="${FALLBACK_ALERT_THRESHOLD:-10}"
PREMIUM_ALERT_THRESHOLD="${PREMIUM_ALERT_THRESHOLD:-25}"
OUTPUT_DIR="${OUTPUT_DIR:-/var/log/synqra}"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_LOG="${OUTPUT_DIR}/block4_${TIMESTAMP}.log"
OUT_REPORT="${OUTPUT_DIR}/block4_${TIMESTAMP}.report.txt"
ROLLBACK_HELPER="${OUTPUT_DIR}/rollback_${SERVICE_NAME}_${TIMESTAMP}.sh"

pass() {
  echo "PASS: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
  echo "WARN: $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
  echo
  echo "== $1 =="
}

section "Block 4 - Monitoring and Rollback Discipline"
date

mkdir -p "${OUTPUT_DIR}"

if ! command -v journalctl >/dev/null 2>&1; then
  fail "journalctl not found"
  echo "RESULT: FAIL"
  exit 1
fi
pass "journalctl is available"

if systemctl is-active --quiet "${SERVICE_NAME}"; then
  pass "${SERVICE_NAME} is active"
else
  fail "${SERVICE_NAME} is not active"
fi

journalctl -u "${SERVICE_NAME}" -n "${LOG_LINES}" --no-pager > "${OUT_LOG}" || true
pass "Captured last ${LOG_LINES} lines from ${SERVICE_NAME} logs"

FALLBACK_NONZERO_COUNT="$(grep -o '"fallbackCount":[0-9]\+' "${OUT_LOG}" | awk -F: '$2 > 0 {count++} END {print count+0}')"
PREMIUM_REQUEST_COUNT="$(grep -o '"premiumRequested":[a-z]\+' "${OUT_LOG}" | awk -F: '$2 == "true" {count++} END {print count+0}')"
TOKEN_CAP_VALUES="$(grep -o '"tokenCap":[0-9]\+' "${OUT_LOG}" | awk -F: '{print $2}' || true)"
MAX_TOKEN_CAP="$(echo "${TOKEN_CAP_VALUES}" | awk 'NF {if ($1 > max) max=$1} END {print max+0}')"

{
  echo "Service: ${SERVICE_NAME}"
  echo "Log file: ${OUT_LOG}"
  echo "Fallback events (count where fallbackCount > 0): ${FALLBACK_NONZERO_COUNT}"
  echo "Premium requests (premiumRequested=true): ${PREMIUM_REQUEST_COUNT}"
  echo "Max observed tokenCap in logs: ${MAX_TOKEN_CAP}"
  echo "Thresholds:"
  echo "  fallback alert threshold: ${FALLBACK_ALERT_THRESHOLD}"
  echo "  premium alert threshold: ${PREMIUM_ALERT_THRESHOLD}"
} | tee "${OUT_REPORT}"

if (( FALLBACK_NONZERO_COUNT > FALLBACK_ALERT_THRESHOLD )); then
  warn "Fallback frequency exceeded threshold (${FALLBACK_NONZERO_COUNT} > ${FALLBACK_ALERT_THRESHOLD})"
else
  pass "Fallback frequency is within threshold"
fi

if (( PREMIUM_REQUEST_COUNT > PREMIUM_ALERT_THRESHOLD )); then
  warn "Premium usage exceeded threshold (${PREMIUM_REQUEST_COUNT} > ${PREMIUM_ALERT_THRESHOLD})"
else
  pass "Premium usage is within threshold"
fi

if (( MAX_TOKEN_CAP == 0 )); then
  warn "No tokenCap entries found in recent logs"
else
  pass "Token cap usage is visible in recent logs"
fi

cat > "${ROLLBACK_HELPER}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
SHA="\${1:-${LAST_KNOWN_GOOD_SHA}}"
if [[ -z "\${SHA}" ]]; then
  echo "Usage: $0 <LAST_KNOWN_GOOD_SHA>"
  exit 1
fi
git -C "${APP_DIR}" checkout "\${SHA}"
pnpm install --frozen-lockfile
pnpm --filter synqra-mvp build
sudo systemctl restart "${SERVICE_NAME}"
sudo systemctl status "${SERVICE_NAME}" --no-pager
EOF
chmod +x "${ROLLBACK_HELPER}"
pass "Generated rollback helper: ${ROLLBACK_HELPER}"

section "Decision"
echo "Pass checks: ${PASS_COUNT}"
echo "Warn checks: ${WARN_COUNT}"
echo "Fail checks: ${FAIL_COUNT}"

if (( FAIL_COUNT > 0 )); then
  echo "RESULT: FAIL"
  exit 1
fi

if (( WARN_COUNT > 0 )); then
  echo "RESULT: PASS_WITH_WARNINGS"
  exit 0
fi

echo "RESULT: PASS"
exit 0
