#!/usr/bin/env bash
set -euo pipefail

safeguard_check() {
  # Basic guard: ensure we're in a git repo and working tree is clean
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[safeguard] Not inside a git repository. Aborting." >&2
    exit 1
  fi

  # Warn but do not block if there are uncommitted changes
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "[safeguard] ⚠️ Working tree has changes. Proceeding anyway." >&2
  fi
}

