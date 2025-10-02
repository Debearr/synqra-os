#!/usr/bin/env bash
set -euo pipefail

# 🔧 ensure_start_script: generate a smart start.sh if missing
ensure_start_script() {
  if [ ! -f start.sh ]; then
    echo "⚠️ No start.sh found. Generating a smart default..."
    if [ -f package.json ]; then
      echo '#!/usr/bin/env bash' > start.sh
      echo 'npm install' >> start.sh
      echo 'npm start' >> start.sh
      echo "🟢 Detected Node.js project. Created Node start.sh"
    elif [ -f requirements.txt ]; then
      echo '#!/usr/bin/env bash' > start.sh
      echo 'pip install -r requirements.txt' >> start.sh
      echo 'python app.py' >> start.sh
      echo "🟡 Detected Python project. Created Python start.sh"
    else
      echo '#!/usr/bin/env bash' > start.sh
      echo 'npm install || true' >> start.sh
      echo 'npm start || echo "Fallback start (please edit manually)"' >> start.sh
      echo "🔵 No clear runtime detected. Defaulting to Node.js fallback."
    fi
    chmod +x start.sh
  fi
}

# 🔧 finalize_deploy: run Railway, capture URL, log & echo
finalize_deploy() {
  local REPO_NAME="$1"
  echo "🚀 Starting deploy for $REPO_NAME..."

  railway up --service="$REPO_NAME" | tee deploy_output.log

  URL=$(grep -o 'https://[^ ]*railway.app' deploy_output.log | tail -n 1 || true)

  if [ -n "$URL" ]; then
    echo -e "\n\033[1;33m🚀 FINAL DEPLOY URL for $REPO_NAME: $URL\033[0m\n"
    if command -v log_deploy >/dev/null 2>&1; then
      log_deploy "$REPO_NAME" "$URL"
    fi
  else
    echo -e "\n❌ No URL found in logs for $REPO_NAME. Check Railway dashboard.\n"
  fi
}

