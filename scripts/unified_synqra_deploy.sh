#!/usr/bin/env bash
set -euo pipefail

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
  echo "[deploy] Starting Synqra deployment verification..."

  # 🛡️ Safeguard check
  safeguard_check

  # 1) Ensure Railway CLI installed
  if ! command -v railway >/dev/null 2>&1; then
    echo "[deploy] Installing Railway CLI..."
    if command -v npm >/dev/null 2>&1; then
      npm i -g @railway/cli
    else
      echo "[deploy] ❌ npm not found. Please install Node.js/npm to continue."
      exit 1
    fi
  fi

  # Ensure jq installed
  if ! command -v jq >/dev/null 2>&1; then
    echo "[deploy] Installing jq..."
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update -y && sudo apt-get install -y jq
    else
      echo "[deploy] ❌ jq is required but not installed. Please install jq and retry."
      exit 1
    fi
  fi

  # 2) Fetch live URL from Railway
  echo "[deploy] Fetching live URL from Railway..."
  url=$(railway status --service synqra-os --json | jq -r '.url // empty') || true
  if [ -z "${url:-}" ]; then
    echo "[deploy] ❌ Could not fetch live Synqra URL"
    exit 1
  fi
  echo "[deploy] ✅ Synqra live at: $url"

  # 3) Auto-open in browser (cross-platform best effort)
  if command -v open >/dev/null 2>&1; then
    open "$url" && echo "[deploy] 🌍 Opened in browser (Mac/Linux open)" || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" && echo "[deploy] 🌍 Opened in browser (Linux xdg-open)" || true
  elif command -v start >/dev/null 2>&1; then
    start "$url" && echo "[deploy] 🌍 Opened in browser (Windows start)" || true
  else
    echo "[deploy] ⚠️ Could not auto-open browser. URL: $url"
  fi

  # 4) Update README.md with live URL
  echo "[deploy] Updating README.md with live URL..."
  if [ -f README.md ] && grep -q "🌍 Live Deployment" README.md; then
    if sed --version >/dev/null 2>&1; then
      sed -i "s|🌍 Live Deployment.*|🌍 Live Deployment: $url|" README.md
    else
      sed -i '' "s|🌍 Live Deployment.*|🌍 Live Deployment: $url|" README.md
    fi
  else
    printf "\n## 🌍 Live Deployment\nSynqra is live here: %s\n" "$url" >> README.md
  fi

  # 5) Commit + push changes (if any)
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [ -n "$(git status --porcelain README.md || true)" ]; then
      git add README.md
      git commit -m "docs: auto-update Synqra live deployment URL"
      git push origin main
      echo "[deploy] ✅ Changes committed and pushed to origin/main."
    else
      echo "[deploy] ℹ️ No changes to commit. Skipping push."
    fi
  else
    echo "[deploy] ⚠️ Not a git repository. Skipping commit and push."
  fi

  echo "[deploy] 🚀 Deployment flow complete."
}

main "$@"

