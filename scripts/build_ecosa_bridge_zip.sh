#!/bin/bash
set -euo pipefail

ZIP_NAME="ECOSA_Cursor_Bridge_v1.zip"
echo "📦 Building $ZIP_NAME..."
cd /workspace
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" macros scripts hooks agents cursor_package.json manifest.yml -x "*.DS_Store"
echo "✅ Build complete: $ZIP_NAME ready for deployment."
