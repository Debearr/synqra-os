#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/_lib_guardian.sh"

URL=$(derive_url)
if [ -z "$URL" ]; then
  warn "No URL env provided; skipping canonical check"; exit 0
fi

CODE_AND_LOC=$(http_head "$URL" || true)
CODE=$(printf '%s\n' "$CODE_AND_LOC" | sed -n '1p')
LOCATION=$(printf '%s\n' "$CODE_AND_LOC" | sed -n '2p')

# Accept 200 or any 3xx redirect to either https or www canonical forms, but flag loops
if [[ "$CODE" =~ ^2..$ ]]; then
  info "Canonical OK (200) at $URL"
  exit 0
fi

if [[ "$CODE" =~ ^3..$ ]] && [ -n "${LOCATION:-}" ]; then
  info "Redirects ($CODE) to $LOCATION"
  # A simple anti-loop guard: next HEAD must not return same URL
  NEXT=$(http_head "$LOCATION" || true)
  NEXT_LOC=$(printf '%s\n' "$NEXT" | sed -n '2p')
  if [ -n "${NEXT_LOC:-}" ] && [ "$NEXT_LOC" = "$URL" ]; then
    error "Redirect loop detected: $URL <-> $LOCATION"
    exit 1
  fi
  exit 0
fi

error "Unexpected status: $CODE for $URL"
exit 1
