#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy_any.sh <repo_name>
#   DRY_RUN=1 ./deploy_any.sh <repo_name>
#   NO_GIT_PUSH=1 NO_BROWSER=1 ./deploy_any.sh <repo_name>
# Example:
#   ./deploy_any.sh synqra-os

main() {
  if [ $# -lt 1 ]; then
    read -r -p "👉 Enter repo name to deploy: " REPO_NAME
    if [ -z "${REPO_NAME:-}" ]; then
      echo "❌ Repo name is required"
      exit 1
    fi
  else
    REPO_NAME="$1"
  fi

  # Resolve repo path candidates in priority order
  CANDIDATES=(
    "$HOME/$REPO_NAME"
    "/workspace/$REPO_NAME"
    "$PWD/$REPO_NAME"
  )
  REPO_PATH=""
  for p in "${CANDIDATES[@]}"; do
    if [ -d "$p" ]; then
      REPO_PATH="$p"
      break
    fi
  done

  echo "[deploy] Starting deployment for $REPO_NAME..."

  # --- Step 0: Switch into repo ---
  if [ -z "$REPO_PATH" ]; then
    echo "[deploy] ❌ Repo '$REPO_NAME' not found in: ${CANDIDATES[*]}"
    exit 1
  fi
  cd "$REPO_PATH"
  echo "[deploy] ✅ Using repo at $REPO_PATH"

  # --- Step 1: Ensure Railway CLI ---
  if ! command -v railway >/dev/null 2>&1; then
    echo "[deploy] Installing Railway CLI..."
    npm i -g @railway/cli
  fi

  # --- Step 2: Ensure jq ---
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

  # --- Step 3: Fetch live URL ---
  url=""
  if railway status --service "$REPO_NAME" --json >/dev/null 2>&1; then
    url=$(railway status --service "$REPO_NAME" --json | jq -r '.url')
  fi
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    # Fallback to project-level URL if available
    if railway status --json >/dev/null 2>&1; then
      url=$(railway status --json | jq -r '.url // empty')
    fi
  fi
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    echo "[deploy] ❌ Could not fetch live URL for $REPO_NAME"
    exit 1
  fi
  echo "[deploy] ✅ $REPO_NAME live here: $url"

  # --- Step 4: Auto-open browser ---
  if [ -z "${NO_BROWSER:-}" ]; then
    case "$OSTYPE" in
      linux*)    xdg-open "$url" >/dev/null 2>&1 & ;;
      darwin*)   open "$url" >/dev/null 2>&1 & ;;
      msys*|cygwin*|win32*) start "" "$url" >/dev/null 2>&1 ;;
      *) echo "[deploy] 🌍 Please open manually: $url" ;;
    esac
  else
    echo "[deploy] 🌍 Skipping browser open (NO_BROWSER=1). URL: $url"
  fi

  # --- Step 5: Update README.md ---
  if [ -f README.md ]; then
    if grep -q "Live Deployment" README.md; then
      sed -i "s|Live here.*|Live here: $url|" README.md
    else
      echo -e "\n## 🌍 Live Deployment\n$REPO_NAME is live here: $url" >> README.md
    fi
  else
    echo "## 🌍 Live Deployment\n$REPO_NAME is live here: $url" > README.md
  fi

  if [ -n "${DRY_RUN:-}" ]; then
    echo "[deploy] 🔎 DRY_RUN=1 set; skipping git commit/push"
  elif [ -n "${NO_GIT_PUSH:-}" ]; then
    echo "[deploy] ⏭️  NO_GIT_PUSH=1 set; not pushing changes"
    git add README.md || true
    git commit -m "docs: auto-update $REPO_NAME live deployment URL" || true
  else
    git add README.md
    git commit -m "docs: auto-update $REPO_NAME live deployment URL" || true
    git push origin main
  fi

  echo "[deploy] 🚀 Finished deployment for $REPO_NAME"
}

main "$@"

