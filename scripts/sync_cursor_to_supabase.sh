#!/bin/bash
set -euo pipefail

ROOT_DIR="/ecosa"; [ -d "$ROOT_DIR" ] || ROOT_DIR="/workspace"

# Load .env if available
if [ -f "$ROOT_DIR/.env" ]; then set -a; source "$ROOT_DIR/.env"; set +a; fi
if [ -f "/workspace/.env" ]; then set -a; source "/workspace/.env"; set +a; fi
: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_KEY:?SUPABASE_KEY is required}"

AGENTS_DIR="/cursor/agents"
if [ ! -d "$AGENTS_DIR" ]; then
  echo "[WARN] $AGENTS_DIR not found; skipping sync"
  exit 0
fi

echo "📡 Syncing Cursor agents to Supabase..."
for f in "$AGENTS_DIR"/*.json; do
  [ -e "$f" ] || continue
  checksum=$(sha256sum "$f" | cut -d' ' -f1)
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  payload=$(jq -n --arg name "$(basename "$f")" --arg checksum "$checksum" --arg ts "$ts" '{agent_name:$name, checksum:$checksum, timestamp:$ts}')
  curl -sS -X POST "$SUPABASE_URL/rest/v1/agent_logs" \
       -H "apikey: $SUPABASE_KEY" \
       -H "Content-Type: application/json" \
       -d "$payload" || { echo "[ERROR] POST failed for $f"; exit 1; }
  echo "[OK] Synced $(basename "$f")"
done

echo "✅ Sync complete"
