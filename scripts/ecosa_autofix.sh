#!/bin/bash
set -euo pipefail

ROOT_DIR="/ecosa"
if [ ! -d "$ROOT_DIR" ]; then ROOT_DIR="/workspace"; fi

echo "⚙️ ECOSA Auto-Fix Triggered — Rebuilding Cursor Bridge"
bash "$ROOT_DIR/scripts/cursor_packager.sh"
if command -v cursor >/dev/null 2>&1; then
  cursor package install --auto "$ROOT_DIR/latest_build.zip" || cursor package install --force "$ROOT_DIR/latest_build.zip"
else
  echo "ℹ️ cursor CLI not found; skipping install step"
fi
bash "$ROOT_DIR/scripts/cursor_integrity_check.sh"
echo "✅ Auto-fix complete."
