#!/usr/bin/env bash
set -euo pipefail

log_deploy() {
  local project="$1"
  local url="$2"
  local percent="$3"

  # Insert glyph rendering inline (for PDF + logs)
  local logName
  if [ -f ".cursor/glyphs/barcodes.json" ]; then
    glyph=$(jq -r --arg proj "$project" '.[$proj].glyphs | keys[0]?' .cursor/glyphs/barcodes.json)
    if [ "$glyph" != "null" ] && [ -n "$glyph" ]; then
      logName="$project [$glyph]"
    else
      logName="$project"
    fi
  else
    logName="$project"
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $logName deployed → $url | ${percent}% complete" >> DEPLOY_LOG.md

  # --- Auto-update projects.json progress ---
  if [ -f "projects.json" ]; then
    tmp=$(mktemp)
    jq --arg proj "$project" --argjson prog "$percent" '
      map(if .name == $proj then .progress = $prog | .last_deploy = (now | todate) else . end)
    ' projects.json > "$tmp" && mv "$tmp" projects.json
  fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  # CLI usage: scripts/deploy_utils.sh log <project> <url> <percent>
  cmd="${1:-}"; shift || true
  case "$cmd" in
    log)
      log_deploy "$@"
      ;;
    *)
      echo "Usage: $0 log <project> <url> <percent>" >&2
      exit 1
      ;;
  esac
fi

