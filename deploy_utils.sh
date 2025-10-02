#!/usr/bin/env bash
set -euo pipefail

# --- Deployment Utilities ---

# Function: log_deploy
# Usage: log_deploy <project_name> <url>
# Example: log_deploy synqra-os https://synqra.up.railway.app
log_deploy() {
  local project_name="$1"
  local url="$2"
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")

  # Write log entry in consistent format
  echo "$timestamp — [PROJECT: $project_name] deployed successfully — URL: $url" \
    | cat - DEPLOY_LOG.md > temp && mv temp DEPLOY_LOG.md

  git add DEPLOY_LOG.md
  git commit -m "docs: log deployment for $project_name"
  git push origin main
  echo "[deploy-utils] 📖 Logged deploy for $project_name"
}

# Function: update_dashboard
# Reads DEPLOY_LOG.md and updates dashboard.html
update_dashboard() {
  cat > dashboard.html <<EOL
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Project Status Dashboard</title></head>
<body>
  <h1>📊 Project Status Dashboard</h1>
  <p>Last updated: $(date +"%Y-%m-%d %H:%M:%S")</p>
  <pre>
$(head -n 30 DEPLOY_LOG.md)
  </pre>
</body>
</html>
EOL

  git add dashboard.html
  git commit -m "chore: auto-update dashboard"
  git push origin main
  echo "[deploy-utils] 📊 Dashboard updated"
}

echo "[deploy-utils] ✅ Loaded deployment utilities"
