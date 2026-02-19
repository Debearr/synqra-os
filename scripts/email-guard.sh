#!/bin/sh
set -eu

EMAIL_PATTERN='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
SAFE_PATTERN='example\.com|localhost|@sentry|@supabase|@radix|@types|@next|@tanstack|yourdomain\.com|your-domain\.com|your-email@domain\.com|your_email@gmail\.com'

if [ -n "$(git diff --cached --name-only)" ]; then
  MODE='staged'
  CHANGED_FILES=$(git diff --cached --name-only)
elif git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  MODE='head'
  CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)
else
  MODE='working'
  CHANGED_FILES=$(git diff --name-only)
fi

if [ -z "${CHANGED_FILES:-}" ]; then
  echo "email-guard: no changed files to scan"
  exit 0
fi

for FILE in $CHANGED_FILES; do
  case "$MODE" in
    staged)
      PATCH=$(git diff --cached -U0 -- "$FILE" || true)
      ;;
    head)
      PATCH=$(git diff -U0 HEAD^ HEAD -- "$FILE" || true)
      ;;
    *)
      PATCH=$(git diff -U0 -- "$FILE" || true)
      ;;
  esac

  if printf '%s\n' "$PATCH" \
    | grep -E '^\+[^+]' \
    | grep -E "$EMAIL_PATTERN" \
    | grep -qvE "$SAFE_PATTERN"; then
    echo "BLOCKED: possible hardcoded email detected in $FILE"
    printf '%s\n' "$PATCH" \
      | grep -E '^\+[^+]' \
      | grep -E "$EMAIL_PATTERN" \
      | grep -vE "$SAFE_PATTERN" || true
    exit 1
  fi
done

echo "email-guard: passed"
exit 0
