#!/bin/bash
set -euo pipefail
echo "🔩 Building ECOSA–Cursor Bridge..."
ROOT_DIR="/ecosa"; [ -d "$ROOT_DIR" ] || ROOT_DIR="/workspace/ecosa"
cp -r "$ROOT_DIR/macros" "$ROOT_DIR/hooks" "$ROOT_DIR/agents" "$ROOT_DIR/" 2>/dev/null || true
cp -r /workspace/macros /workspace/hooks /workspace/agents "$ROOT_DIR/" 2>/dev/null || true
echo "✅ Build complete"
