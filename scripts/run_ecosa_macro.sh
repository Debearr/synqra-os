#!/bin/bash
set -euo pipefail

MACRO_NAME=${1:-"ECOSA Build Cursor Package"}
RETRIES=3
TIMEOUT=90

ROOT_DIR="/ecosa"
if [ ! -d "$ROOT_DIR" ]; then ROOT_DIR="/workspace"; fi

run_with_timeout() {
  local seconds=$1; shift
  timeout "$seconds" bash -lc "$*"
}

echo "▶️ Running macro: $MACRO_NAME"
for attempt in $(seq 1 "$RETRIES"); do
  echo "Attempt $attempt/$RETRIES"
  if run_with_timeout "$TIMEOUT" bash "$ROOT_DIR/scripts/cursor_packager.sh" && \
     run_with_timeout "$TIMEOUT" bash "$ROOT_DIR/scripts/cursor_integrity_check.sh" && \
     command -v cursor >/dev/null 2>&1 && run_with_timeout "$TIMEOUT" cursor package install --auto "$ROOT_DIR/latest_build.zip"; then
    echo "✅ Macro $MACRO_NAME completed successfully"
    exit 0
  fi
  echo "⚠️ Macro attempt $attempt failed; applying autofix and retrying"
  bash "$ROOT_DIR/scripts/ecosa_autofix.sh" || true
  sleep 2
done

echo "❌ Macro $MACRO_NAME failed after $RETRIES attempts"
exit 1
