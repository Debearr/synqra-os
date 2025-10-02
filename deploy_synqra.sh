#!/usr/bin/env bash
set -euo pipefail

# --- Load shared utils ---
source ./deploy_utils.sh

main() {
  REPO_NAME="synqra-os"
  REPO_PATH="$HOME/$REPO_NAME"

  echo "[deploy-synqra] 🚀 Starting deployment for $REPO_NAME..."

  # --- Step 0: cd into repo ---
  if [ ! -d "$REPO_PATH" ]; then
    echo "[deploy-synqra] ❌ Repo not found at $REPO_PATH"
    exit 1
  fi
  cd "$REPO_PATH"

  # --- Step 1: Ensure Railway CLI ---
  if ! command -v railway >/dev/null 2>&1; then
    npm i -g @railway/cli
  fi

  # --- Step 2: Fetch live URL ---
  url=$(railway status --service "$REPO_NAME" --json | jq -r ".url")
  echo "[deploy-synqra] ✅ Live at: $url"

  # --- Step 3: Log + Update Dashboard ---
  log_deploy "$REPO_NAME" "$url"
  update_dashboard
}

main "$@"
