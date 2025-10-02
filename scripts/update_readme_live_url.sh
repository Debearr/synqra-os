#!/usr/bin/env bash
set -euo pipefail

# Update README.md with the current Railway live URL for Synqra.
#
# Behavior:
# - Uses Railway CLI via npx to fetch project status in JSON
# - Extracts the .url field using jq if available, otherwise Node.js
# - Updates or appends the "🌐 Live Deployment" section in README.md
# - Optional: commits and pushes the change when COMMIT=1
#
# Inputs (environment variables):
# - RAILWAY_TOKEN           (optional) Non-interactive auth token
# - RAILWAY_PROJECT_ID      (optional) Project context
# - RAILWAY_ENVIRONMENT     (optional) Environment context
# - RAILWAY_SERVICE_NAME    (optional) Name hint (default: synqra-os)
# - README_PATH             (optional) Path to README (default: /workspace/README.md)
# - COMMIT                  (optional) If set to 1, git add/commit/push

have_cmd() { command -v "$1" >/dev/null 2>&1; }

readonly README_PATH=${README_PATH:-/workspace/README.md}
readonly SERVICE_NAME=${RAILWAY_SERVICE_NAME:-synqra-os}

ensure_tools() {
  if ! have_cmd node; then
    echo "[update] Node.js is required for JSON parsing fallback" >&2
    exit 1
  fi
}

railway_login_if_token() {
  if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
    npx -y @railway/cli login --token "$RAILWAY_TOKEN" >/dev/null 2>&1 || true
  fi
}

# Fetch status JSON. Some CLI versions do not support --service; attempt without it.
fetch_status_json() {
  # Try with --json only (portable across CLI versions)
  npx -y @railway/cli status --json 2>/dev/null || return 1
}

extract_url() {
  if have_cmd jq; then
    jq -r '.url // empty' | sed 's/\r$//'
    return 0
  fi
  # Node fallback for JSON parsing
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);if(j&&j.url){process.stdout.write(String(j.url))}}catch(e){process.exit(1)}})"
}

update_readme_with_url() {
  local url="$1"
  if [[ -z "$url" ]]; then
    echo "[update] Empty URL; refusing to update README" >&2
    return 1
  fi
  if [[ ! -f "$README_PATH" ]]; then
    echo "[update] README not found at $README_PATH; creating new file" >&2
    printf "# synqra-os\n" > "$README_PATH"
  fi

  # Use Node to perform an idempotent update/replace
  node - <<'NODE' "$README_PATH" "$url"
const fs = require('fs');
const path = process.argv[2];
const liveUrl = process.argv[3];

let text = fs.readFileSync(path, 'utf8');

const header = '## 🌐 Live Deployment';
const block = `\n${header}\n[Synqra is live here](${liveUrl})\n`;

if (text.includes(header)) {
  // Replace entire section from header to next header or end of file
  const pattern = new RegExp(`${header}[\s\S]*?(?=\n## |\n?$)`, 'm');
  if (pattern.test(text)) {
    text = text.replace(pattern, block.trim());
  } else {
    // Fallback: Replace the link line only
    const linkPattern = /\[Synqra is live here\]\([^)]*\)/;
    if (linkPattern.test(text)) {
      text = text.replace(linkPattern, `[Synqra is live here](${liveUrl})`);
    } else {
      text = text + block;
    }
  }
} else {
  text = text + block;
}

fs.writeFileSync(path, text);
console.log(`[update] README updated with URL: ${liveUrl}`);
NODE
}

maybe_commit_and_push() {
  if [[ "${COMMIT:-0}" != "1" ]]; then
    return 0
  fi
  if ! have_cmd git; then
    echo "[update] git not available; skipping commit/push" >&2
    return 0
  fi
  git add "$README_PATH" || true
  git commit -m "docs: auto-update Synqra live deployment URL" || true
  # Push to the current branch
  current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ -n "$current_branch" ]]; then
    git push origin "$current_branch" || true
  else
    git push || true
  fi
}

main() {
  ensure_tools
  railway_login_if_token

  echo "[update] Fetching Railway status JSON (service: $SERVICE_NAME)"
  local json
  if ! json=$(fetch_status_json); then
    echo "[update] Failed to fetch status. Ensure Railway auth/context is set." >&2
    exit 1
  fi
  local url
  url=$(printf "%s" "$json" | extract_url || true)
  if [[ -z "$url" || ! "$url" =~ ^https?:// ]]; then
    echo "[update] Unable to derive a valid URL from status JSON" >&2
    exit 1
  fi

  update_readme_with_url "$url"
  maybe_commit_and_push
}

main "$@"

