#!/usr/bin/env bash
set -euo pipefail

# Loads .env if present
if [[ -f .env ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -d '\n')
fi

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_KEY:-}" ]]; then
  echo "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env" >&2
  exit 1
fi

echo "Seeding one pending intent via REST..."
bash /workspace/scripts/seed_intent.sh

echo "Checking latest intents..."
curl -sS \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/content_intents?select=id,platform,audience,status,updated_at&order=updated_at.desc&limit=5" | jq '.[]'

echo "Done. Ensure your n8n workflow is running; status should flip to completed automatically."

