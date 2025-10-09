#!/usr/bin/env bash
set -euo pipefail
BRANCH="$1"
FILEPATH="$2"
MSG="$3"

# Ensure repo state is clean enough to proceed
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repository" >&2
  exit 1
fi

git checkout -b "$BRANCH" || git checkout "$BRANCH"
git add "$FILEPATH"
# Allow no-op commit without failing the pipeline
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "$MSG"
fi

echo "✔ Committed on branch: $BRANCH"