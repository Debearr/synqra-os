#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -d '\n')
fi

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_KEY:-}" ]]; then
  echo "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env" >&2
  exit 1
fi

QUERY='content_intents?select=id,platform,scheduled_time,preview_url,status,updated_at&status=eq.completed&order=updated_at.desc&limit=10'

curl -sS \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/$QUERY" | jq '.[]'

