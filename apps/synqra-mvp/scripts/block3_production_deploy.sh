#!/usr/bin/env bash

set -euo pipefail

DOMAIN="${DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
SERVICE_NAME="${SERVICE_NAME:-synqra-mvp}"
APP_PORT="${APP_PORT:-3004}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_ENV_FILE="${APP_ENV_FILE:-/etc/synqra/synqra-mvp.env}"
DNS_EXPECTED_IP="${DNS_EXPECTED_IP:-}"
INTERNAL_ROUTING_TOKEN="${INTERNAL_ROUTING_TOKEN:-}"
APP_DIR="${APP_DIR:-$(pwd)}"
RUN_BUILD="${RUN_BUILD:-1}"
RUN_FALLBACK_SMOKE="${RUN_FALLBACK_SMOKE:-1}"

NGINX_CONF="/etc/nginx/sites-available/${SERVICE_NAME}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
ROLLBACK_DIR="/var/backups/${SERVICE_NAME}_$(date +%Y%m%d_%H%M%S)"
TARGET_BASE_URL="https://${DOMAIN}"

PASS_COUNT=0
FAIL_COUNT=0
TMP_DIR="$(mktemp -d /tmp/synqra-block3.XXXXXX)"

REQUIRED_ENV_KEYS=(
  GROQ_API_KEY
  OPENROUTER_API_KEY
  INTERNAL_ROUTING_TOKEN
)

BACKUP_ENV_FILE=""

cleanup() {
  if [[ -n "${BACKUP_ENV_FILE}" && -f "${BACKUP_ENV_FILE}" && -f "${APP_ENV_FILE}" ]]; then
    cp "${BACKUP_ENV_FILE}" "${APP_ENV_FILE}"
    systemctl restart "${SERVICE_NAME}" >/dev/null 2>&1 || true
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

section() {
  echo
  echo "== $1 =="
}

require_cmd() {
  local cmd="$1"
  if command -v "${cmd}" >/dev/null 2>&1; then
    pass "Command available: ${cmd}"
  else
    fail "Missing command: ${cmd}"
  fi
}

ensure_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "FAIL: run this script as root (sudo)"
    exit 1
  fi
}

backup_if_exists() {
  local file="$1"
  if [[ -f "${file}" ]]; then
    cp "${file}" "${ROLLBACK_DIR}/$(basename "${file}")"
  fi
}

check_required_inputs() {
  if [[ -z "${DOMAIN}" ]]; then
    fail "DOMAIN is required"
  fi
  if [[ -z "${LETSENCRYPT_EMAIL}" ]]; then
    fail "LETSENCRYPT_EMAIL is required"
  fi
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
  code="$(curl -sS -o "${body_file}" -D "${headers_file}" -w "%{http_code}" -X POST "${TARGET_BASE_URL}/api/council" -H "Content-Type: application/json" "$@" --data "${payload}" || true)"
  echo "${code}|${headers_file}|${body_file}"
}

assert_header_equals() {
  local headers_file="$1"
  local name="$2"
  local expected="$3"
  local label="$4"
  local actual
  actual="$(get_header "${headers_file}" "${name}")"
  if [[ "${actual}" == "${expected}" ]]; then
    pass "${label}: ${name}=${expected}"
  else
    fail "${label}: expected ${name}=${expected}, got ${actual:-missing}"
  fi
}

write_rollback_script() {
  local rollback_script="${ROLLBACK_DIR}/rollback.sh"
  cat > "${rollback_script}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ -n "\${1:-}" ]]; then
  git -C "${APP_DIR}" checkout "\$1"
fi
if [[ -f "${ROLLBACK_DIR}/$(basename "${NGINX_CONF}")" ]]; then
  cp "${ROLLBACK_DIR}/$(basename "${NGINX_CONF}")" "${NGINX_CONF}"
fi
if [[ -f "${NGINX_CONF}" ]]; then
  ln -sf "${NGINX_CONF}" "${NGINX_ENABLED}"
fi
nginx -t
systemctl reload nginx
systemctl restart "${SERVICE_NAME}"
echo "Rollback applied for ${SERVICE_NAME}"
EOF
  chmod +x "${rollback_script}"
  echo "Rollback script: ${rollback_script}"
}

section "Block 3 - Production Deployment (A)"
date
ensure_root
mkdir -p "${ROLLBACK_DIR}"

section "1) Preflight"
check_required_inputs
require_cmd nginx
require_cmd systemctl
require_cmd curl
require_cmd certbot
require_cmd python3

if (( FAIL_COUNT > 0 )); then
  echo "Preflight failed."
  exit 1
fi

section "2) Domain and DNS"
if command -v dig >/dev/null 2>&1; then
  CURRENT_IPS="$(dig +short A "${DOMAIN}" | tr '\n' ' ' | xargs || true)"
  echo "A records for ${DOMAIN}: ${CURRENT_IPS:-none}"
  if [[ -n "${DNS_EXPECTED_IP}" ]]; then
    if dig +short A "${DOMAIN}" | grep -Fxq "${DNS_EXPECTED_IP}"; then
      pass "DNS includes expected IP (${DNS_EXPECTED_IP})"
    else
      fail "DNS does not include expected IP (${DNS_EXPECTED_IP})"
    fi
  else
    pass "DNS resolved (set DNS_EXPECTED_IP for strict verification)"
  fi
else
  fail "dig command not found (install dnsutils for DNS verification)"
fi

section "3) Build and Prepare App"
if [[ "${RUN_BUILD}" == "1" ]]; then
  if [[ ! -d "${APP_DIR}" ]]; then
    fail "APP_DIR not found: ${APP_DIR}"
  elif [[ ! -f "${APP_DIR}/package.json" ]]; then
    fail "package.json not found in APP_DIR: ${APP_DIR}"
  else
    (
      cd "${APP_DIR}"
      npm run build
    ) && pass "Build completed (npm run build)"
  fi
else
  pass "Build skipped (RUN_BUILD=${RUN_BUILD})"
fi

section "4) Nginx Reverse Proxy"
backup_if_exists "${NGINX_CONF}"
cat > "${NGINX_CONF}" <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN};

  client_max_body_size 20m;

  location / {
    proxy_pass http://${APP_HOST}:${APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 90;
  }
}
EOF
ln -sf "${NGINX_CONF}" "${NGINX_ENABLED}"
if nginx -t; then
  systemctl reload nginx
  pass "Nginx config validated and reloaded"
else
  fail "Nginx config validation failed"
fi

section "5) HTTPS via Certbot"
if certbot --nginx --non-interactive --agree-tos --redirect -m "${LETSENCRYPT_EMAIL}" -d "${DOMAIN}"; then
  pass "Certbot provisioned HTTPS certificate"
else
  fail "Certbot failed to provision certificate"
fi

section "6) Environment and Service Health"
if [[ ! -f "${APP_ENV_FILE}" ]]; then
  fail "Environment file missing: ${APP_ENV_FILE}"
else
  pass "Environment file found: ${APP_ENV_FILE}"
  for key in "${REQUIRED_ENV_KEYS[@]}"; do
    if grep -q "^${key}=" "${APP_ENV_FILE}"; then
      pass "Env key present: ${key}"
    else
      fail "Missing env key: ${key}"
    fi
  done
fi

if systemctl restart "${SERVICE_NAME}"; then
  pass "Service restarted: ${SERVICE_NAME}"
else
  fail "systemctl restart failed for ${SERVICE_NAME}"
fi

if systemctl is-active --quiet "${SERVICE_NAME}"; then
  pass "Service is active: ${SERVICE_NAME}"
else
  fail "Service is not active: ${SERVICE_NAME}"
fi

if systemctl is-active --quiet ollama; then
  pass "Ollama service is active"
else
  fail "Ollama service is not active"
fi

section "7) Public Smoke Tests"
FAST_PAYLOAD='{"prompt":"Fast public smoke test","intent":"public","taskType":"general","premiumIntent":false}'
IFS='|' read -r CODE HEADERS BODY <<<"$(post_json public_fast "${FAST_PAYLOAD}")"
if [[ "${CODE}" == "200" ]]; then
  pass "Fast route returned 200"
else
  fail "Fast route expected 200, got ${CODE}"
fi
assert_header_equals "${HEADERS}" "x-council-model-tier" "fast" "Fast route"
assert_header_equals "${HEADERS}" "x-council-provider" "groq" "Fast route"

PREMIUM_PAYLOAD='{"prompt":"Premium public smoke test","intent":"public","premiumIntent":true}'
IFS='|' read -r CODE HEADERS BODY <<<"$(post_json public_premium "${PREMIUM_PAYLOAD}")"
if [[ "${CODE}" == "200" ]]; then
  pass "Premium route returned 200"
else
  fail "Premium route expected 200, got ${CODE}"
fi
assert_header_equals "${HEADERS}" "x-council-model-tier" "premium" "Premium route"

NO_TOKEN_INTERNAL_PAYLOAD='{"prompt":"Internal gate public test","intent":"internal","premiumIntent":false}'
IFS='|' read -r CODE HEADERS BODY <<<"$(post_json public_internal_block "${NO_TOKEN_INTERNAL_PAYLOAD}")"
if [[ "${CODE}" == "403" ]]; then
  pass "Internal route without token returns 403"
else
  fail "Internal route without token should return 403 (got ${CODE})"
fi

if [[ -z "${INTERNAL_ROUTING_TOKEN}" ]]; then
  fail "INTERNAL_ROUTING_TOKEN missing for internal positive smoke test"
else
  IFS='|' read -r CODE HEADERS BODY <<<"$(post_json public_internal_ok "${NO_TOKEN_INTERNAL_PAYLOAD}" -H "x-synqra-internal-token: ${INTERNAL_ROUTING_TOKEN}")"
  if [[ "${CODE}" == "200" ]]; then
    pass "Internal route with token returned 200"
  else
    fail "Internal route with token expected 200, got ${CODE}"
  fi
  assert_header_equals "${HEADERS}" "x-council-intent" "internal" "Internal route"
fi

if [[ "${RUN_FALLBACK_SMOKE}" == "1" ]]; then
  if [[ ! -f "${APP_ENV_FILE}" ]]; then
    fail "Cannot run fallback smoke: APP_ENV_FILE not found (${APP_ENV_FILE})"
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

    IFS='|' read -r CODE HEADERS BODY <<<"$(post_json public_fallback "${FAST_PAYLOAD}")"
    if [[ "${CODE}" == "200" ]]; then
      pass "Fallback smoke route returned 200"
    else
      fail "Fallback smoke route expected 200, got ${CODE}"
    fi
    assert_header_equals "${HEADERS}" "x-council-provider" "openrouter" "Fallback route"
    FALLBACK_COUNT="$(get_header "${HEADERS}" "x-council-fallback-count")"
    if [[ "${FALLBACK_COUNT}" =~ ^[0-9]+$ ]] && (( FALLBACK_COUNT >= 1 )); then
      pass "Fallback count incremented on forced failure"
    else
      fail "Fallback count should be >=1 during forced fallback"
    fi

    cp "${BACKUP_ENV_FILE}" "${APP_ENV_FILE}"
    systemctl restart "${SERVICE_NAME}"
    BACKUP_ENV_FILE=""
  fi
else
  fail "Fallback smoke not executed (RUN_FALLBACK_SMOKE=${RUN_FALLBACK_SMOKE})"
fi

section "8) Recent Logs and Rollback"
journalctl -u "${SERVICE_NAME}" -n 120 --no-pager > "${ROLLBACK_DIR}/service.log" || true
echo "Saved logs to ${ROLLBACK_DIR}/service.log"
write_rollback_script

section "Decision"
echo "Pass checks: ${PASS_COUNT}"
echo "Fail checks: ${FAIL_COUNT}"
if (( FAIL_COUNT > 0 )); then
  echo "RESULT: FAIL"
  echo "Run rollback script if needed: ${ROLLBACK_DIR}/rollback.sh"
  exit 1
fi
echo "RESULT: PASS"
echo "Live deployment checks completed."
exit 0
