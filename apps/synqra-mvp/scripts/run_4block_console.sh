#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/synqra/apps/synqra-mvp}"
RUN_DIR="${RUN_DIR:-/var/log/synqra/deploy_runs}"
TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="${RUN_DIR}/${TS}"

BASE_URL="${BASE_URL:-http://localhost:3004}"
SERVICE_NAME="${SERVICE_NAME:-synqra-mvp}"
APP_ENV_FILE="${APP_ENV_FILE:-/etc/synqra/synqra-mvp.env}"
DOMAIN="${DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
DNS_EXPECTED_IP="${DNS_EXPECTED_IP:-}"
INTERNAL_ROUTING_TOKEN="${INTERNAL_ROUTING_TOKEN:-}"
LAST_KNOWN_GOOD_SHA="${LAST_KNOWN_GOOD_SHA:-}"

BLOCK1_LOG="${OUT_DIR}/block1.log"
BLOCK2_LOG="${OUT_DIR}/block2.log"
BLOCK3_LOG="${OUT_DIR}/block3.log"
BLOCK4_LOG="${OUT_DIR}/block4.log"
SUMMARY="${OUT_DIR}/summary.txt"

mkdir -p "${OUT_DIR}"

status_line() {
  local block="$1"
  local status="$2"
  local notes="$3"
  printf "%s | %s | %s\n" "${block}" "${status}" "${notes}" | tee -a "${SUMMARY}"
}

run_block() {
  local block_name="$1"
  local cmd="$2"
  local log_file="$3"
  echo "===== ${block_name} START $(date -Is) =====" | tee -a "${SUMMARY}"
  set +e
  bash -lc "${cmd}" >"${log_file}" 2>&1
  local rc=$?
  set -e
  if [[ ${rc} -eq 0 ]]; then
    status_line "${block_name}" "PASS" "log=${log_file}"
  else
    status_line "${block_name}" "FAIL" "rc=${rc} log=${log_file}"
    echo "Stopping execution due to failure in ${block_name}. See ${log_file}"
    exit ${rc}
  fi
}

echo "Synqra strict deployment flow: C -> B -> A -> Monitor" | tee "${SUMMARY}"
echo "Run directory: ${OUT_DIR}" | tee -a "${SUMMARY}"
echo "APP_DIR=${APP_DIR}" | tee -a "${SUMMARY}"

cd "${APP_DIR}"

run_block "BLOCK1_CAPACITY_C" \
  "bash scripts/block1_capacity_readiness.sh" \
  "${BLOCK1_LOG}"

run_block "BLOCK2_ROUTING_B" \
  "BASE_URL='${BASE_URL}' INTERNAL_ROUTING_TOKEN='${INTERNAL_ROUTING_TOKEN}' FORCE_GROQ_FAILURE=1 SERVICE_NAME='${SERVICE_NAME}' APP_ENV_FILE='${APP_ENV_FILE}' bash scripts/block2_routing_stress.sh" \
  "${BLOCK2_LOG}"

run_block "BLOCK3_PROD_A" \
  "DOMAIN='${DOMAIN}' LETSENCRYPT_EMAIL='${LETSENCRYPT_EMAIL}' SERVICE_NAME='${SERVICE_NAME}' APP_PORT=3004 APP_ENV_FILE='${APP_ENV_FILE}' DNS_EXPECTED_IP='${DNS_EXPECTED_IP}' INTERNAL_ROUTING_TOKEN='${INTERNAL_ROUTING_TOKEN}' bash scripts/block3_production_deploy.sh" \
  "${BLOCK3_LOG}"

run_block "BLOCK4_MONITOR" \
  "SERVICE_NAME='${SERVICE_NAME}' APP_DIR='${APP_DIR}' LAST_KNOWN_GOOD_SHA='${LAST_KNOWN_GOOD_SHA}' bash scripts/block4_monitoring_rollback.sh" \
  "${BLOCK4_LOG}"

echo "===== COMPLETE $(date -Is) =====" | tee -a "${SUMMARY}"
echo "Summary: ${SUMMARY}"
