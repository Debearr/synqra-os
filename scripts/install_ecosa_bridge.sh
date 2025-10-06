#!/bin/bash
set -euo pipefail

TARGET_ROOT="/ecosa"
if [ ! -w "/" ]; then
  TARGET_ROOT="/workspace/ecosa"
fi

echo "🔧 Building ECOSA–Cursor Bridge..."
mkdir -p "$TARGET_ROOT/logs"
cp -r ./macros ./scripts ./hooks ./agents "$TARGET_ROOT/" 2>/dev/null || true
cp -r /workspace/macros /workspace/scripts /workspace/hooks /workspace/agents "$TARGET_ROOT/" 2>/dev/null || true
echo "✅ ECOSA Bridge Installed Successfully at $TARGET_ROOT"
