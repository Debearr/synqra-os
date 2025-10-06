#!/bin/bash
set -euo pipefail

ROOT_DIR="/ecosa"
if [ ! -d "$ROOT_DIR" ]; then ROOT_DIR="/workspace"; fi

ZIP_PATH="$ROOT_DIR/latest_build.zip"
CHECKSUM_FILE="$ROOT_DIR/.checksum"
DIFF_FLAG_FILE="$ROOT_DIR/.diff_found"

if [ -f "$ZIP_PATH" ]; then
  new_checksum=$(sha256sum "$ZIP_PATH" | cut -d" " -f1)
  old_checksum=""
  if [ -f "$CHECKSUM_FILE" ]; then
    old_checksum=$(cat "$CHECKSUM_FILE" || true)
  fi
  echo "$new_checksum" > "$CHECKSUM_FILE"
  if [ -n "$old_checksum" ] && [ "$old_checksum" != "$new_checksum" ]; then
    echo "⚠️ Drift detected (checksum changed)."
    echo "diff_found" > "$DIFF_FLAG_FILE"
  else
    [ -f "$DIFF_FLAG_FILE" ] && rm -f "$DIFF_FLAG_FILE"
  fi
  echo "✅ Integrity verified. Checksum: $new_checksum"
  exit 0
fi

echo "❌ Package missing — rebuilding..."
bash "$ROOT_DIR/scripts/cursor_packager.sh"
if [ -f "$ZIP_PATH" ]; then
  new_checksum=$(sha256sum "$ZIP_PATH" | cut -d" " -f1)
  echo "$new_checksum" > "$CHECKSUM_FILE"
  echo "✅ Rebuild complete. Checksum: $new_checksum"
  exit 0
else
  echo "❌ Rebuild failed: $ZIP_PATH still missing"
  exit 1
fi
