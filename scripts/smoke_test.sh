#!/usr/bin/env bash
set -euo pipefail

# Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY

echo "Seeding one pending intent..."
psql "${SUPABASE_DB_URL:-}" -v ON_ERROR_STOP=1 -f /workspace/scripts/seed_intent.sql || echo "Skipping direct DB seed; run in Supabase SQL editor if needed."

echo "Checking for completed draft status in content_intents..."
curl -sS \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/content_intents?select=id,platform,audience,status,updated_at&order=updated_at.desc&limit=5" | jq '.[]'

echo "Done. Verify status -> completed and preview_url created in SYNQRA drafts."

