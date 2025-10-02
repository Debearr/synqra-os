#!/usr/bin/env bash
set -euo pipefail

# safeguard.sh - Prevent duplicate commits (double-squash protection)

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

export -f safeguard_check

