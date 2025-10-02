#!/usr/bin/env bash

# Utilities for deploy agents

log_deploy() {
  local project="$1"
  local percent="$2"
  local url="$3"
  local glyph=""
  if [ -f projects.json ]; then
    glyph=$(jq -r --arg p "$project" '.[$p].barcodeGlyph // ""' projects.json 2>/dev/null)
  fi
  local glyphTag=""
  if [ -n "$glyph" ] && [ "$glyph" != "null" ]; then
    glyphTag="[GLYPH:$glyph]"
  fi
  # Build deploy line
  local deploy_line="$(date '+%Y-%m-%d %H:%M:%S') | $project $glyphTag | $percent% | $url"

  # Check global warning toggle
  local showWarnings=$(jq -r '.showGlyphWarnings // false' projects.json 2>/dev/null || echo "false")
  if [ "$showWarnings" = "true" ]; then
    # If any glyph missing for this project, mark a global warning
    if [ -n "$glyphTag" ] && [ ! -f ".cursor/glyphs/${glyph}.svg" ]; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') [GLOBAL WARNING] ⚠️ Some projects missing SVG glyphs, fallback used." >> DeployLog.md
      echo "[GLOBAL WARNING BANNER] ⚠️ Some projects missing SVG glyphs, fallback used." >> DeployLog.md
    fi
  fi

  echo "$deploy_line" >> DeployLog.md

  # Record heartbeat speed for dashboard/PDF sync
  if [ -n "$HEARTBEAT_SPEED" ]; then
    echo "  💓 Heartbeat: $HEARTBEAT_SPEED" >> DeployLog.md
  fi
}

