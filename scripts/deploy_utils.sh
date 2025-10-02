#!/usr/bin/env bash
set -euo pipefail

log_deploy() {
  local project="$1"
  local url="$2"

  # --- Determine progress increment automatically ---
  local percent
  if [ -f "projects.json" ]; then
    local current mode increment
    current=$(jq -r --arg proj "$project" '.[] | select(.name==$proj) | .progress' projects.json)
    mode=$(jq -r --arg proj "$project" '.[] | select(.name==$proj) | .mode // "Adaptive"' projects.json)

    if [ "$mode" = "Fixed" ]; then
      increment=2
    else
      if command -v bc >/dev/null 2>&1; then
        if (( $(echo "$current < 50" | bc -l) )); then
          increment=5
        elif (( $(echo "$current < 80" | bc -l) )); then
          increment=3
        elif (( $(echo "$current < 95" | bc -l) )); then
          increment=1
        else
          increment=0.5
        fi
      else
        # bc missing: fallback simple tiers
        if [ "$current" -lt 50 ]; then
          increment=5
        elif [ "$current" -lt 80 ]; then
          increment=3
        elif [ "$current" -lt 95 ]; then
          increment=1
        else
          increment=1
        fi
      fi
    fi

    if command -v bc >/dev/null 2>&1; then
      percent=$(echo "$current + $increment" | bc -l)
      if (( $(echo "$percent > 100" | bc -l) )); then percent=100; fi
    else
      percent=$(( current + increment ))
      if [ "$percent" -gt 100 ]; then percent=100; fi
    fi
  else
    percent=1
  fi

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

