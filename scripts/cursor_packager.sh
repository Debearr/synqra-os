#!/bin/bash
set -euo pipefail

APP_DIR="/cursor/agents"
OUTPUT="latest_build.zip"

if [ -d "$APP_DIR" ]; then
  echo "📦 Building Cursor package from $APP_DIR -> $OUTPUT"
  (cd "$APP_DIR" && zip -r "/workspace/$OUTPUT" . -x "*.DS_Store" )
else
  echo "⚠️ Source directory $APP_DIR not found; packaging workspace/scripts, macros, hooks instead"
  (cd "/workspace" && zip -r "$OUTPUT" macros scripts hooks -x "*.DS_Store")
fi

echo "✅ Cursor package built: $OUTPUT"
