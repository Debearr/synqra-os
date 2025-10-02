#!/usr/bin/env bash
set -euo pipefail

# Clean previous URL
rm -f DEPLOY_URL.txt

# Usage:
#   ./deploy_any_repo.sh <repo_name>
# Example:
#   ./deploy_any_repo.sh my-repo

main() {
  if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <repo_name>"
    exit 1
  fi

  REPO_NAME="$1"
  echo "[deploy] Starting generic deployment for $REPO_NAME..."

  # Simulated deploy steps...
  url="https://deploy.example.com/$REPO_NAME"

  # Optionally update README or perform other repo-agnostic steps here

  if git diff --quiet; then
    echo "[deploy] No changes to commit."
  else
    git add -A
    git commit -m "chore(deploy): update artifacts for $REPO_NAME"
    git push origin main || true
  fi

  echo "$url" > DEPLOY_URL.txt
  echo "[deploy] 🌍 Deployment URL saved to DEPLOY_URL.txt"

  echo "[deploy] 🚀 Finished deployment for $REPO_NAME"
}

main "$@"

