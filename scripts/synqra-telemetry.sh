#!/usr/bin/env bash
set -euo pipefail

TARGET_URL=${1:-https://synqra.co}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
LATENCY_SEC=$(curl -o /dev/null -s -w "%{time_total}" "$TARGET_URL")
LATENCY_MS=$(awk -v t="$LATENCY_SEC" 'BEGIN{printf "%.0f", t*1000}')

if [ "$STATUS_CODE" = "200" ]; then
  HEALTH="healthy"
else
  HEALTH="degraded"
fi

SUPABASE_URL=${SUPABASE_URL:-}
SUPABASE_SERVICE_ROLE=${SUPABASE_SERVICE_ROLE:-}

PAYLOAD=$(jq -c -n --arg ts "$TIMESTAMP" --arg sc "$STATUS_CODE" --arg lm "$LATENCY_MS" --arg h "$HEALTH" '{timestamp:$ts, status_code:$sc, latency:$lm, health:$h}' 2>/dev/null || echo "{\"timestamp\":\"$TIMESTAMP\",\"status_code\":\"$STATUS_CODE\",\"latency\":\"$LATENCY_MS\",\"health\":\"$HEALTH\"}")

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE" ]; then
  curl -s -o /dev/null -X POST "$SUPABASE_URL/rest/v1/telemetry" \
    -H "apikey: $SUPABASE_SERVICE_ROLE" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
  echo "✅ Telemetry log sent at $TIMESTAMP (Status: $HEALTH, ${LATENCY_MS}ms)"
else
  echo "ℹ️ Dry run (missing SUPABASE_URL/SUPABASE_SERVICE_ROLE). Would send: $PAYLOAD"
fi
