#!/usr/bin/env bash
set -euo pipefail

main() {
  echo "[deploy] Starting Synqra deployment verification..."

  # --- Step 0: Ensure we are in the correct repo ---
  REPO_NAME="synqra-os"
  REPO_PATH="$HOME/$REPO_NAME"

  if [ ! -d "$REPO_PATH" ]; then
    echo "[deploy] ❌ Repo '$REPO_NAME' not found at $REPO_PATH"
    exit 1
  fi

  echo "[deploy] Switching to $REPO_PATH..."
  cd "$REPO_PATH"

  # --- Step 1: Ensure Railway CLI installed ---
  if ! command -v railway >/dev/null 2>&1; then
    echo "[deploy] Installing Railway CLI..."
    npm i -g @railway/cli
  fi

  # --- Step 2: Ensure jq installed ---
  if ! command -v jq >/dev/null 2>&1; then
    echo "[deploy] Installing jq..."
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update -y && sudo apt-get install -y jq
    elif command -v choco >/dev/null 2>&1; then
      choco install jq -y
    else
      echo "[deploy] ❌ Could not auto-install jq. Please install manually."
      exit 1
    fi
  fi

  # --- Step 3: Fetch live URL ---
  url=$(railway status --service synqra-os --json | jq -r '.url')
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    echo "[deploy] ❌ Could not fetch live Synqra URL"
    exit 1
  fi
  echo "[deploy] ✅ Synqra is live here: $url"

  # --- Step 4: Auto-open in browser (cross-platform) ---
  case "$OSTYPE" in
    linux*)    xdg-open "$url" >/dev/null 2>&1 & ;;
    darwin*)   open "$url" >/dev/null 2>&1 & ;;
    msys*|cygwin*|win32*) start "" "$url" >/dev/null 2>&1 ;;
    *) echo "[deploy] 🌍 Please open manually: $url" ;;
  esac

  # --- Step 5: Update README with URL ---
  if [ -f README.md ]; then
    if grep -q "Live Deployment" README.md; then
      sed -i "s|Synqra is live here.*|Synqra is live here ($url)|" README.md
    else
      echo -e "\n## 🌍 Live Deployment\nSynqra is live here ($url)" >> README.md
    fi
  else
    echo "## 🌍 Live Deployment\nSynqra is live here ($url)" > README.md
  fi

  git add README.md
  git commit -m "docs: auto-update Synqra live deployment URL" || true
  git push origin main || true

  echo "[deploy] 🚀 Deployment finished!"
}

main "$@"

