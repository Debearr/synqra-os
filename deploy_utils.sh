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
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $project $glyphTag | $percent% | $url" >> DeployLog.md
}

