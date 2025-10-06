#!/bin/bash
set -euo pipefail

ROOT_DIR="/ecosa"
if [ ! -d "$ROOT_DIR" ]; then ROOT_DIR="/workspace"; fi

# Load .env if present
if [ -f "$ROOT_DIR/.env" ]; then
  # shellcheck disable=SC1090
  set -a; source "$ROOT_DIR/.env"; set +a
elif [ -f "/workspace/.env" ]; then
  set -a; source "/workspace/.env"; set +a
fi

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_KEY:?SUPABASE_KEY is required}"

LOG_SOURCE="/ecosa/logs/build.log"
if [ ! -f "$LOG_SOURCE" ]; then
  echo "[WARN] $LOG_SOURCE not found; creating empty payload"
  echo "" > "$ROOT_DIR/temp_build.log"
else
  tail -n 100 "$LOG_SOURCE" > "$ROOT_DIR/temp_build.log"
fi

curl -sS -X POST "$SUPABASE_URL/rest/v1/ecosa_logs" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d @"$ROOT_DIR/temp_build.log" || {
    echo "[ERROR] Failed to push logs to Supabase"
    exit 1
  }

echo "[OK] Logs pushed to Supabase"
