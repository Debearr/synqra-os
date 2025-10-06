#!/bin/bash
set -euo pipefail

ZIP_PATH="/workspace/latest_build.zip"
CHECKSUM_FILE="/workspace/.checksum"

if [ -f "$ZIP_PATH" ]; then
  checksum=$(sha256sum "$ZIP_PATH" | cut -d" " -f1)
  echo "$checksum" > "$CHECKSUM_FILE"
  echo "✅ Integrity verified. Checksum: $checksum"
  exit 0
fi

echo "❌ Package missing — rebuilding..."
bash /workspace/scripts/cursor_packager.sh
if [ -f "$ZIP_PATH" ]; then
  checksum=$(sha256sum "$ZIP_PATH" | cut -d" " -f1)
  echo "$checksum" > "$CHECKSUM_FILE"
  echo "✅ Rebuild complete. Checksum: $checksum"
  exit 0
else
  echo "❌ Rebuild failed: $ZIP_PATH still missing"
  exit 1
fi
