#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3004}"
COUNCIL_URL="${BASE_URL%/}/api/council"
INTERNAL_ROUTING_TOKEN="${INTERNAL_ROUTING_TOKEN:-}"

# Optional failure simulation controls
FORCE_GROQ_FAILURE="${FORCE_GROQ_FAILURE:-0}"
SERVICE_NAME="${SERVICE_NAME:-}"
APP_ENV_FILE="${APP_ENV_FILE:-}"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
TMP_DIR="$(mktemp -d /tmp/synqra-block2.XXXXXX)"
BACKUP_ENV_FILE=""

cleanup() {
  if [[ -n "${BACKUP_ENV_FILE}" && -f "${BACKUP_ENV_FILE}" && -n "${APP_ENV_FILE}" ]]; then
    cp "${BACKUP_ENV_FILE}" "${APP_ENV_FILE}"
    if [[ -n "${SERVICE_NAME}" ]]; then
      systemctl restart "${SERVICE_NAME}" >/dev/null 2>&1 || true
    fi
  fi
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

pass() {
  echo "PASS: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
  echo "SKIP: $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

section() {
  echo
  echo "== $1 =="
}

get_header() {
  local file="$1"
  local key="$2"
  awk -F': ' -v k="${key}" 'tolower($1)==tolower(k){print $2}' "${file}" | tr -d '\r' | tail -n 1
}

post_json() {
  local name="$1"
  local payload="$2"
  shift 2
  local headers_file="${TMP_DIR}/${name}.headers"
  local body_file="${TMP_DIR}/${name}.body"
  local code
  code="$(curl -sS -o "${body_file}" -D "${headers_file}" -w "%{http_code}" -X POST "${COUNCIL_URL}" -H "Content-Type: application/json" "$@" --data "${payload}" || true)"
  echo "${code}|${headers_file}|${body_file}"
}

assert_status() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "${actual}" == "${expected}" ]]; then
    pass "${label}: status ${expected}"
  else
    fail "${label}: expected status ${expected}, got ${actual}"
  fi
}

section "Block 2 - Stress Test Routing and Runway"
date
echo "Target: ${COUNCIL_URL}"

section "1) Default Groq Route"
DEFAULT_PAYLOAD='{"prompt":"Test fast default","intent":"public","taskType":"general","premiumIntent":false}'
IFS='|' read -r CODE HEADERS BODY <<<"$(post_json default "${DEFAULT_PAYLOAD}")"
assert_status "${CODE}" "200" "Default route"
DEFAULT_PROVIDER="$(get_header "${HEADERS}" "x-council-provider")"
DEFAULT_MODEL="$(get_header "${HEADERS}" "x-council-model")"
DEFAULT_TIER="$(get_header "${HEADERS}" "x-council-model-tier")"
DEFAULT_TOKEN_CAP="$(get_header "${HEADERS}" "x-council-token-cap")"
DEFAULT_FALLBACK="$(get_header "${HEADERS}" "x-council-fallback-count")"
echo "Provider=${DEFAULT_PROVIDER} Model=${DEFAULT_MODEL} Tier=${DEFAULT_TIER} TokenCap=${DEFAULT_TOKEN_CAP} Fallback=${DEFAULT_FALLBACK}"
if [[ "${DEFAULT_PROVIDER}" == "groq" ]]; then
  pass "Default provider is groq"
else
  fail "Default provider should be groq (got ${DEFAULT_PROVIDER:-missing})"
fi
if [[ "${DEFAULT_TIER}" == "fast" ]]; then
  pass "Default model tier is fast"
else
  fail "Default model tier should be fast (got ${DEFAULT_TIER:-missing})"
fi
if [[ "${DEFAULT_TOKEN_CAP}" =~ ^[0-9]+$ ]] && (( DEFAULT_TOKEN_CAP > 0 )); then
  pass "Default route token cap header is present"
else
  fail "Default route token cap header missing or invalid"
fi

section "2) Force Groq Failure and Validate OpenRouter Fallback"
if [[ "${FORCE_GROQ_FAILURE}" == "1" ]]; then
  if [[ -z "${SERVICE_NAME}" || -z "${APP_ENV_FILE}" ]]; then
    fail "FORCE_GROQ_FAILURE=1 requires SERVICE_NAME and APP_ENV_FILE"
  elif [[ ! -f "${APP_ENV_FILE}" ]]; then
    fail "APP_ENV_FILE not found: ${APP_ENV_FILE}"
  else
    BACKUP_ENV_FILE="${TMP_DIR}/env.backup"
    cp "${APP_ENV_FILE}" "${BACKUP_ENV_FILE}"

    if grep -q '^GROQ_API_KEY=' "${APP_ENV_FILE}"; then
      sed -i 's/^GROQ_API_KEY=.*/GROQ_API_KEY=force_failure_invalid_key/' "${APP_ENV_FILE}"
    else
      echo "GROQ_API_KEY=force_failure_invalid_key" >> "${APP_ENV_FILE}"
    fi
    systemctl restart "${SERVICE_NAME}"
    sleep 4

    IFS='|' read -r CODE HEADERS BODY <<<"$(post_json fallback "${DEFAULT_PAYLOAD}")"
    assert_status "${CODE}" "200" "Fallback route after forced Groq failure"
    FALLBACK_PROVIDER="$(get_header "${HEADERS}" "x-council-provider")"
    FALLBACK_TOKEN_CAP="$(get_header "${HEADERS}" "x-council-token-cap")"
    FALLBACK_COUNT="$(get_header "${HEADERS}" "x-council-fallback-count")"
    echo "Provider=${FALLBACK_PROVIDER} TokenCap=${FALLBACK_TOKEN_CAP} Fallback=${FALLBACK_COUNT}"
    if [[ "${FALLBACK_PROVIDER}" == "openrouter" ]]; then
      pass "Fallback provider is openrouter"
    else
      fail "Expected openrouter after forced Groq failure (got ${FALLBACK_PROVIDER:-missing})"
    fi
    if [[ -n "${FALLBACK_COUNT}" && "${FALLBACK_COUNT}" =~ ^[0-9]+$ && "${FALLBACK_COUNT}" -ge 1 ]]; then
      pass "Fallback count indicates failover"
    else
      fail "Fallback count should be >= 1 after forced failure"
    fi
    if [[ "${FALLBACK_TOKEN_CAP}" =~ ^[0-9]+$ ]] && (( FALLBACK_TOKEN_CAP > 0 )); then
      pass "Fallback route token cap header is present"
    else
      fail "Fallback route token cap header missing or invalid"
    fi

    cp "${BACKUP_ENV_FILE}" "${APP_ENV_FILE}"
    systemctl restart "${SERVICE_NAME}"
    BACKUP_ENV_FILE=""
  fi
else
  skip "Groq failure simulation skipped. Run with FORCE_GROQ_FAILURE=1 SERVICE_NAME=... APP_ENV_FILE=... to execute."
fi

section "3) Premium Escalation Route"
PREMIUM_PAYLOAD='{"prompt":"Test premium route","intent":"public","premiumIntent":true}'
IFS='|' read -r CODE HEADERS BODY <<<"$(post_json premium "${PREMIUM_PAYLOAD}")"
assert_status "${CODE}" "200" "Premium route"
PREMIUM_TIER="$(get_header "${HEADERS}" "x-council-model-tier")"
PREMIUM_MODEL="$(get_header "${HEADERS}" "x-council-model")"
PREMIUM_TOKEN_CAP="$(get_header "${HEADERS}" "x-council-token-cap")"
echo "ModelTier=${PREMIUM_TIER} Model=${PREMIUM_MODEL} TokenCap=${PREMIUM_TOKEN_CAP}"
if [[ "${PREMIUM_TIER}" == "premium" ]]; then
  pass "Premium model tier header is correct"
else
  fail "Expected x-council-model-tier=premium"
fi
if [[ "${PREMIUM_TOKEN_CAP}" =~ ^[0-9]+$ ]] && (( PREMIUM_TOKEN_CAP > 0 )); then
  pass "Premium route token cap header is present"
else
  fail "Premium route token cap header missing or invalid"
fi

case "${PREMIUM_MODEL}" in
  qwen/qwen3-32b|openai/gpt-oss-120b|qwen2.5:14b)
    pass "Premium model is in allowlist"
    ;;
  *)
    fail "Premium model is outside expected allowlist (${PREMIUM_MODEL:-missing})"
    ;;
esac

section "4) Internal Routing Gate and Internal Route"
INTERNAL_PAYLOAD='{"prompt":"Test internal route","intent":"internal","premiumIntent":false}'
IFS='|' read -r CODE HEADERS BODY <<<"$(post_json internal_guard "${INTERNAL_PAYLOAD}" -H "x-synqra-internal-token: invalid-token")"
assert_status "${CODE}" "403" "Internal route guard with invalid token"

if [[ -z "${INTERNAL_ROUTING_TOKEN}" ]]; then
  fail "INTERNAL_ROUTING_TOKEN is missing; cannot validate positive internal route"
else
  IFS='|' read -r CODE HEADERS BODY <<<"$(post_json internal_ok "${INTERNAL_PAYLOAD}" -H "x-synqra-internal-token: ${INTERNAL_ROUTING_TOKEN}")"
  assert_status "${CODE}" "200" "Internal route with valid token"
  INTERNAL_INTENT="$(get_header "${HEADERS}" "x-council-intent")"
  INTERNAL_PROVIDER="$(get_header "${HEADERS}" "x-council-provider")"
  INTERNAL_TOKEN_CAP="$(get_header "${HEADERS}" "x-council-token-cap")"
  echo "Intent=${INTERNAL_INTENT} Provider=${INTERNAL_PROVIDER} TokenCap=${INTERNAL_TOKEN_CAP}"
  if [[ "${INTERNAL_INTENT}" == "internal" ]]; then
    pass "Internal route intent header is correct"
  else
    fail "Expected x-council-intent=internal"
  fi
  if [[ "${INTERNAL_TOKEN_CAP}" =~ ^[0-9]+$ ]] && (( INTERNAL_TOKEN_CAP > 0 )); then
    pass "Internal route token cap header is present"
  else
    fail "Internal route token cap header missing or invalid"
  fi
fi

section "5) Headers and Logs"
for header in x-council-provider x-council-model x-council-model-tier x-council-intent x-council-task-type x-council-token-cap x-council-fallback-count; do
  value="$(get_header "${TMP_DIR}/default.headers" "${header}")"
  if [[ -n "${value}" ]]; then
    pass "Default response includes ${header}"
  else
    fail "Default response missing ${header}"
  fi
done

if [[ -n "${SERVICE_NAME}" ]]; then
  if journalctl -u "${SERVICE_NAME}" -n 120 --no-pager | grep -Eq 'council\.provider\.attempt|council\.provider\.failure|council\.request\.completed'; then
    pass "Service logs include routing events"
  else
    fail "Service logs missing expected routing events"
  fi
else
  skip "SERVICE_NAME not set; log validation skipped"
fi

section "Decision"
echo "Pass checks: ${PASS_COUNT}"
echo "Fail checks: ${FAIL_COUNT}"
echo "Skip checks: ${SKIP_COUNT}"

if (( FAIL_COUNT > 0 )); then
  echo "RESULT: FAIL"
  exit 1
fi

if (( SKIP_COUNT > 0 )); then
  echo "RESULT: INCOMPLETE"
  exit 2
fi

echo "RESULT: PASS"
exit 0
