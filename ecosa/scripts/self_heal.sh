#!/bin/bash
set -euo pipefail
echo "♻️ Running self-heal cycle..."
ROOT_DIR="/ecosa"; [ -d "$ROOT_DIR" ] || ROOT_DIR="/workspace/ecosa"
BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"
AGENTS_DIR="/cursor/agents"; [ -d "$AGENTS_DIR" ] || AGENTS_DIR="/workspace/cursor/agents"
find "$AGENTS_DIR" -type f -mtime +7 -exec cp -t "$BACKUP_DIR" {} + || true
bash "$ROOT_DIR/scripts/check_integrity.sh" || bash "$ROOT_DIR/scripts/build_bridge.sh"
echo "✅ Self-heal complete"
