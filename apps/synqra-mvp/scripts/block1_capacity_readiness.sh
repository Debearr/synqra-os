#!/usr/bin/env bash

set -euo pipefail

MIN_RAM_GB="${MIN_RAM_GB:-8}"
MODEL_FAST="${MODEL_FAST:-llama3.1:8b}"
MODEL_PREMIUM="${MODEL_PREMIUM:-qwen2.5:14b}"
AUTO_INSTALL_OLLAMA="${AUTO_INSTALL_OLLAMA:-0}"
TEST_PROMPT_FAST="${TEST_PROMPT_FAST:-Hello from Ollama fast model}"
TEST_PROMPT_PREMIUM="${TEST_PROMPT_PREMIUM:-Hello from Ollama premium model}"
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"
MIN_AVAILABLE_MB_AFTER_TEST="${MIN_AVAILABLE_MB_AFTER_TEST:-512}"
MAX_SWAP_PAGES_DELTA="${MAX_SWAP_PAGES_DELTA:-1024}"

PASS_COUNT=0
FAIL_COUNT=0

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

section "Block 1 - Capacity and Readiness"
date

section "1) Host Capacity Snapshot"
if command -v free >/dev/null 2>&1; then
  free -h
  pass "Captured RAM snapshot (free -h)"
else
  fail "free command not found"
fi

if command -v lscpu >/dev/null 2>&1; then
  lscpu
  pass "Captured CPU snapshot (lscpu)"
else
  fail "lscpu command not found"
fi

if command -v df >/dev/null 2>&1; then
  df -h
  pass "Captured filesystem snapshot (df -h)"
else
  fail "df command not found"
fi

if [[ ! -r /proc/meminfo ]]; then
  fail "/proc/meminfo not readable"
  echo "RESULT: FAIL"
  exit 1
fi

TOTAL_RAM_GB="$(awk '/MemTotal/ {printf "%.2f", $2/1024/1024}' /proc/meminfo)"
TOTAL_RAM_GB_INT="$(awk '/MemTotal/ {print int($2/1024/1024)}' /proc/meminfo)"
echo "Detected RAM: ${TOTAL_RAM_GB} GB"

if (( TOTAL_RAM_GB_INT < MIN_RAM_GB )); then
  fail "RAM below ${MIN_RAM_GB} GB (${TOTAL_RAM_GB} GB detected)"
else
  pass "RAM is at least ${MIN_RAM_GB} GB"
fi

section "2) Ollama Availability and Service Health"
if ! command -v ollama >/dev/null 2>&1; then
  if [[ "${AUTO_INSTALL_OLLAMA}" == "1" ]]; then
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL https://ollama.com/install.sh | sh
    else
      fail "curl is required to auto-install Ollama"
      echo "RESULT: FAIL"
      exit 1
    fi
  else
    fail "ollama CLI is not installed (set AUTO_INSTALL_OLLAMA=1 to auto-install)"
    echo "RESULT: FAIL"
    exit 1
  fi
fi
pass "ollama CLI is installed"

if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-active --quiet ollama; then
    pass "systemctl status ollama is active"
  else
    fail "ollama service is not active (systemctl)"
  fi
else
  fail "systemctl not available to validate ollama service"
fi

if ! curl -fsS "${OLLAMA_BASE_URL}/api/tags" >/tmp/synqra_ollama_tags.json 2>/dev/null; then
  fail "Ollama API not reachable at ${OLLAMA_BASE_URL}"
  echo "RESULT: FAIL"
  exit 1
fi
pass "Ollama API reachable at ${OLLAMA_BASE_URL}"

section "3) Pull Required Models"
for model in "${MODEL_FAST}" "${MODEL_PREMIUM}"; do
  if ollama pull "${model}"; then
    pass "Model pull succeeded (${model})"
  else
    fail "Model pull failed (${model})"
  fi
done

section "4) Inference Validation"
PAGES_BEFORE="$(awk '/pswpin/ {in=$2} /pswpout/ {out=$2} END {print in+out+0}' /proc/vmstat)"

INFER_LOG_FAST="$(mktemp /tmp/synqra_ollama_fast.XXXXXX.log)"
INFER_LOG_PREMIUM="$(mktemp /tmp/synqra_ollama_premium.XXXXXX.log)"

timeout 180 ollama run "${MODEL_FAST}" "${TEST_PROMPT_FAST}" >"${INFER_LOG_FAST}" 2>&1 || true
timeout 240 ollama run "${MODEL_PREMIUM}" "${TEST_PROMPT_PREMIUM}" >"${INFER_LOG_PREMIUM}" 2>&1 || true

if grep -qiE "error|failed|panic|killed" "${INFER_LOG_FAST}"; then
  fail "Fast model inference showed error markers (${MODEL_FAST})"
else
  pass "Fast model inference completed (${MODEL_FAST})"
fi

if grep -qiE "error|failed|panic|killed" "${INFER_LOG_PREMIUM}"; then
  fail "Premium model inference showed error markers (${MODEL_PREMIUM})"
else
  pass "Premium model inference completed (${MODEL_PREMIUM})"
fi

echo "Fast model output sample:"
head -n 5 "${INFER_LOG_FAST}" || true
echo "Premium model output sample:"
head -n 5 "${INFER_LOG_PREMIUM}" || true

section "5) Resource Check During/After Test"
if command -v top >/dev/null 2>&1; then
  top -b -n 1 | head -n 15 || true
  pass "Captured top snapshot"
else
  fail "top command not found"
fi

AVAILABLE_MB="$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)"
echo "MemAvailable after test: ${AVAILABLE_MB} MB"
if (( AVAILABLE_MB < MIN_AVAILABLE_MB_AFTER_TEST )); then
  fail "Available memory below ${MIN_AVAILABLE_MB_AFTER_TEST} MB after inference"
else
  pass "Available memory is above ${MIN_AVAILABLE_MB_AFTER_TEST} MB after inference"
fi

PAGES_AFTER="$(awk '/pswpin/ {in=$2} /pswpout/ {out=$2} END {print in+out+0}' /proc/vmstat)"
SWAP_PAGES_DELTA=$((PAGES_AFTER - PAGES_BEFORE))
echo "Swap pages delta during inference: ${SWAP_PAGES_DELTA}"
if (( SWAP_PAGES_DELTA > MAX_SWAP_PAGES_DELTA )); then
  fail "Swap usage indicates hard thrash (delta pages ${SWAP_PAGES_DELTA} > ${MAX_SWAP_PAGES_DELTA})"
else
  pass "No hard swap thrash detected"
fi

section "Decision"
echo "Pass checks: ${PASS_COUNT}"
echo "Fail checks: ${FAIL_COUNT}"

if (( FAIL_COUNT > 0 )); then
  echo "RESULT: FAIL"
  echo "Recommendation: upgrade VPS resources or use cloud-only providers for live traffic."
  exit 1
fi

echo "RESULT: PASS"
echo "Recommendation: proceed to Block 2."
exit 0
