#!/bin/bash
set -euo pipefail
echo "⚙️ ECOSA Auto-Fix Triggered — Rebuilding Cursor Bridge"
bash /workspace/scripts/cursor_packager.sh
if command -v cursor >/dev/null 2>&1; then
  cursor package install --auto /workspace/latest_build.zip || cursor package install --force /workspace/latest_build.zip
else
  echo "ℹ️ cursor CLI not found; skipping install step"
fi
bash /workspace/scripts/cursor_integrity_check.sh
echo "✅ Auto-fix complete."
