#!/bin/bash
set -euo pipefail

ZIP_NAME="ECOSA_Cursor_Bridge_v1.zip"
echo "📦 Building $ZIP_NAME..."
cd /workspace
zip -r "$ZIP_NAME" macros scripts hooks cursor_package.json -x "*.DS_Store"
echo "✅ Build complete: $ZIP_NAME ready for deployment."
