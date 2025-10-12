#!/usr/bin/env bash
set -Eeuo pipefail

# Configuration with sensible defaults
HEALTHCHECK_URL="${HEALTHCHECK_URL:-https://synqra.co}"
RAILWAY_SERVICE="${RAILWAY_SERVICE:-synqra-os}"
POST_DEPLOY_WAIT_S="${POST_DEPLOY_WAIT_S:-30}"
CURL_CONNECT_TIMEOUT_S="${CURL_CONNECT_TIMEOUT_S:-5}"
CURL_MAX_TIME_S="${CURL_MAX_TIME_S:-20}"
CURL_RETRIES="${CURL_RETRIES:-2}"

# Optional notifications
NOTIFY_WEBHOOK_URL="${NOTIFY_WEBHOOK_URL:-}"     # Slack/Discord compatible webhook
RESEND_API_KEY="${RESEND_API_KEY:-}"             # Resend email API key
NOTIFY_EMAIL_TO="${NOTIFY_EMAIL_TO:-}"           # Comma-separated list of recipients
EMAIL_FROM="${EMAIL_FROM:-alerts@synqra.co}"     # Email sender address

started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "[autoheal] Started at ${started_at}"

die() {
  echo "[autoheal] ERROR: $*" >&2
  exit 1
}

join_by() {
  local IFS="$1"; shift; echo "$*"
}

json_escape() {
  # Minimal JSON string escaper for newlines and quotes
  echo -n "$1" | sed -e 's/\\/\\\\/g' -e 's/\"/\\\"/g' -e 's/\n/\\n/g'
}

send_notifications() {
  local subject="$1"
  local message="$2"

  # Webhook (Slack/Discord)
  if [[ -n "$NOTIFY_WEBHOOK_URL" ]]; then
    local payload
    payload="{\n  \"text\": \"$(json_escape "$message")\",\n  \"content\": \"$(json_escape "$message")\"\n}"
    curl -sS -X POST "$NOTIFY_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "$payload" \
      >/dev/null || echo "[autoheal] Warn: webhook notification failed"
  fi

  # Email via Resend
  if [[ -n "$RESEND_API_KEY" && -n "$NOTIFY_EMAIL_TO" ]]; then
    # Build recipients JSON (allow comma-separated)
    IFS=',' read -r -a recipients <<<"$NOTIFY_EMAIL_TO"
    local to_json
    if (( ${#recipients[@]} == 1 )); then
      to_json="\"${recipients[0]}\""
    else
      local quoted
      for r in "${recipients[@]}"; do
        quoted+="\"$r\","
      done
      to_json="[${quoted%,}]"
    fi

    local email_payload
    email_payload="{\n  \"from\": \"$(json_escape "$EMAIL_FROM")\",\n  \"to\": ${to_json},\n  \"subject\": \"$(json_escape "$subject")\",\n  \"text\": \"$(json_escape "$message")\"\n}"

    curl -sS -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer ${RESEND_API_KEY}" \
      -H 'Content-Type: application/json' \
      -d "$email_payload" \
      >/dev/null || echo "[autoheal] Warn: email notification failed"
  fi
}

check_health() {
  local url="$1"
  local http_status
  http_status=$(curl -sS -o /dev/null \
    --connect-timeout "$CURL_CONNECT_TIMEOUT_S" \
    --max-time "$CURL_MAX_TIME_S" \
    --retry "$CURL_RETRIES" --retry-delay 2 \
    -w "%{http_code}" "$url" || echo "000")
  echo "$http_status"
}

have_cmd() { command -v "$1" >/dev/null 2>&1; }

select_railway_cmd() {
  if have_cmd railway; then
    echo "railway"
  else
    echo "npx -y @railway/cli"
  fi
}

attempt_redeploy() {
  local service="$1"
  local cli
  cli=$(select_railway_cmd)

  # Try a sequence of plausible Railway commands
  local cmds=(
    "$cli redeploy --service \"$service\""
    "$cli service redeploy --service \"$service\""
    "$cli deploy --service \"$service\""
    "$cli up --service \"$service\""
  )

  local success=1
  for c in "${cmds[@]}"; do
    echo "[autoheal] Trying: $c"
    # shellcheck disable=SC2086
    if eval $c; then
      success=0
      break
    else
      echo "[autoheal] Command failed, trying next option..."
    fi
  done
  return $success
}

main() {
  local initial_status
  initial_status=$(check_health "$HEALTHCHECK_URL")
  echo "[autoheal] Initial health status: HTTP ${initial_status} for ${HEALTHCHECK_URL}"

  local outcome
  local redeploy_attempted="no"

  if [[ "$initial_status" =~ ^2[0-9]{2}$ ]]; then
    outcome="Healthy"
  else
    redeploy_attempted="yes"
    echo "[autoheal] Service unhealthy (http=${initial_status}). Initiating redeploy for service '${RAILWAY_SERVICE}'..."

    if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
      echo "[autoheal] Warn: RAILWAY_TOKEN not set; redeploy may fail due to auth."
    fi

    if attempt_redeploy "$RAILWAY_SERVICE"; then
      echo "[autoheal] Redeploy triggered successfully. Waiting ${POST_DEPLOY_WAIT_S}s before recheck..."
      sleep "$POST_DEPLOY_WAIT_S"
      local post_status
      post_status=$(check_health "$HEALTHCHECK_URL")
      echo "[autoheal] Post-redeploy health status: HTTP ${post_status}"
      if [[ "$post_status" =~ ^2[0-9]{2}$ ]]; then
        outcome="Recovered after redeploy"
      else
        outcome="Still unhealthy after redeploy (http=${post_status})"
      fi
    else
      outcome="Redeploy failed"
    fi
  fi

  local finished_at
  finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local subject="Synqra Auto-Heal Report: ${outcome}"
  local report
  report=$(cat <<EOF
Synqra Auto-Heal Report
Time (UTC): ${finished_at}
URL: ${HEALTHCHECK_URL}
Service: ${RAILWAY_SERVICE}
Initial HTTP: ${initial_status}
Redeploy attempted: ${redeploy_attempted}
Outcome: ${outcome}
EOF
)

  echo "[autoheal] ${outcome}"
  echo "[autoheal] Sending notifications (if configured)"
  send_notifications "$subject" "$report"

  if [[ "$outcome" == "Healthy" || "$outcome" == "Recovered after redeploy" ]]; then
    return 0
  else
    return 1
  fi
}

main "$@"
