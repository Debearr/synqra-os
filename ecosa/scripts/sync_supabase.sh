#!/bin/bash
set -euo pipefail
echo "📡 Syncing agents to Supabase..."
: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_KEY:?SUPABASE_KEY is required}"
AGENTS_DIR="/cursor/agents"; [ -d "$AGENTS_DIR" ] || AGENTS_DIR="/workspace/cursor/agents"
for f in "$AGENTS_DIR"/*.json; do
  [ -e "$f" ] || continue
  checksum=$(sha256sum "$f" | cut -d' ' -f1)
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  payload=$(jq -n --arg name "$(basename "$f")" --arg checksum "$checksum" --arg ts "$ts" '{agent_name:$name, checksum:$checksum, timestamp:$ts}')
  curl -s -X POST "$SUPABASE_URL/rest/v1/agent_logs" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload"
done
echo "✅ Sync complete"
