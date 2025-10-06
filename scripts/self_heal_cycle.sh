#!/bin/bash
set -euo pipefail

ROOT_DIR="/ecosa"; [ -d "$ROOT_DIR" ] || ROOT_DIR="/workspace"
BACKUP_DIR="$ROOT_DIR/backups/stable_snapshot"
mkdir -p "$BACKUP_DIR"

echo "♻️ Running ECOSA Self-Heal Cycle..."
find /cursor/agents -type f -mtime +7 -exec cp -t "$BACKUP_DIR" {} + || true
bash "$ROOT_DIR/scripts/cursor_integrity_check.sh" || bash "$ROOT_DIR/scripts/build_ecosa_bridge_zip.sh"
echo "✅ Self-heal complete"
