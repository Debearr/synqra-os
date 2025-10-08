#!/usr/bin/env bash
set -euo pipefail

# Seeds one pending intent via Supabase REST.
# Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in the environment.

if [[ -f .env ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -d '\n')
fi

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_KEY:-}" ]]; then
  echo "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env" >&2
  exit 1
fi

PAYLOAD='{"transcript":"Launch fall tasting menu next Friday 7pm, highlight chef table, Instagram focus, locals 25-40","platform":"Instagram","audience":"Toronto foodies"}'

curl -sS \
  -X POST \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "[$PAYLOAD]" \
  "$SUPABASE_URL/rest/v1/content_intents" | jq '.[] // .'

