#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy_any_repo.sh <repo_name>
# Example:
#   ./deploy_any_repo.sh synqra-os

safeguard_check() {
  echo "[safeguard] 🔍 Checking for duplicate commits..."
  last_msg=$(git log -1 --pretty=%B || echo "")
  prev_msg=$(git log -2 --pretty=%B | tail -n1 || echo "")

  if [[ "$last_msg" == "$prev_msg" && -n "$last_msg" ]]; then
    echo "[safeguard] ❌ Duplicate commit detected: '$last_msg'"
    echo "[safeguard] Aborting deploy to prevent double-squash."
    exit 1
  fi

  echo "[safeguard] ✅ No duplicate commits. Safe to continue."
}

main() {
  if [ $# -lt 1 ]; then
    echo "❌ Please provide a repo name. Example: ./deploy_any_repo.sh synqra-os"
    exit 1
  fi

  REPO_NAME="$1"
  REPO_PATH="$HOME/$REPO_NAME"

  echo "[deploy] Starting deployment for $REPO_NAME..."

  # Step 0: Switch into repo
  if [ ! -d "$REPO_PATH" ]; then
    echo "[deploy] ❌ Repo '$REPO_NAME' not found at $REPO_PATH"
    exit 1
  fi
  cd "$REPO_PATH"
  echo "[deploy] ✅ Using repo at $REPO_PATH"

  # 🛡️ Safeguard check
  safeguard_check

  # Step 1: Ensure Railway CLI
  if ! command -v railway >/dev/null 2>&1; then
    echo "[deploy] Installing Railway CLI..."
    npm i -g @railway/cli
  fi

  # Step 2: Ensure jq
  if ! command -v jq >/dev/null 2>&1; then
    echo "[deploy] Installing jq..."
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update -y && sudo apt-get install -y jq
    elif command -v choco >/dev/null 2>&1; then
      choco install jq -y
    else
      echo "[deploy] ❌ Could not install jq automatically."
      exit 1
    fi
  fi

  # Step 3: Fetch live URL
  url=$(railway status --service "$REPO_NAME" --json | jq -r '.url')
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    echo "[deploy] ❌ Could not fetch live URL for $REPO_NAME"
    exit 1
  fi
  echo "[deploy] ✅ $REPO_NAME live here: $url"

  # Step 4: Auto-open browser
  case "$OSTYPE" in
    linux*)    xdg-open "$url" >/dev/null 2>&1 & ;;
    darwin*)   open "$url" >/dev/null 2>&1 & ;;
    msys*|cygwin*|win32*) start "" "$url" >/dev/null 2>&1 ;;
    *) echo "[deploy] 🌍 Please open manually: $url" ;;
  esac

  # Step 5: Update README.md
  if [ -f README.md ]; then
    if grep -q "Live Deployment" README.md; then
      sed -i "s|Live here.*|Live here: $url|" README.md
    else
      echo -e "\n## 🌍 Live Deployment\n$REPO_NAME is live here: $url" >> README.md
    fi
  else
    echo "## 🌍 Live Deployment\n$REPO_NAME is live here: $url" > README.md
  fi

  git add README.md
  git commit -m "docs: auto-update $REPO_NAME live deployment URL"
  git push origin main

  echo "[deploy] 🚀 Finished deployment for $REPO_NAME"
}

main "$@"

