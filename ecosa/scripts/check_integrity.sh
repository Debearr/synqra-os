#!/bin/bash
set -euo pipefail
echo "🧩 Checking Cursor agent integrity..."
AGENTS_DIR="/cursor/agents"; [ -d "$AGENTS_DIR" ] || AGENTS_DIR="/workspace/cursor/agents"
if [ ! -d "$AGENTS_DIR" ]; then
  echo "[WARN] Agents dir not found: $AGENTS_DIR"; exit 0
fi
for f in "$AGENTS_DIR"/*.json; do
  [ -e "$f" ] || continue
  if command -v jq >/dev/null 2>&1; then
    jq empty "$f" || { echo "❌ Corrupted agent: $f"; exit 1; }
  fi
done
echo "✅ All agents validated"
