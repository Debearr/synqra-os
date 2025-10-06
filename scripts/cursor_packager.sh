#!/bin/bash
set -euo pipefail

ROOT_DIR="/ecosa"
if [ ! -d "$ROOT_DIR" ]; then
  ROOT_DIR="/workspace"
fi

APP_DIR="/cursor/agents"
OUTPUT="latest_build.zip"

rm -f "$ROOT_DIR/$OUTPUT"
if [ -d "$APP_DIR" ]; then
  echo "📦 Building Cursor package from $APP_DIR -> $ROOT_DIR/$OUTPUT"
  (cd "$APP_DIR" && zip -r "$ROOT_DIR/$OUTPUT" . -x "*.DS_Store")
else
  echo "⚠️ Source directory $APP_DIR not found; packaging $ROOT_DIR/scripts, macros, hooks, agents, manifest.yml instead"
  (cd "$ROOT_DIR" && zip -r "$OUTPUT" macros scripts hooks agents manifest.yml cursor_package.json -x "*.DS_Store")
fi

echo "✅ Cursor package built: $ROOT_DIR/$OUTPUT"
