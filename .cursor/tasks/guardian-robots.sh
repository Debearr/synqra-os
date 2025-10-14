#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/_lib_guardian.sh"

URL=$(derive_url)
if [ -z "$URL" ]; then
  warn "No URL env provided; skipping robots.txt check"; exit 0
fi
ORIGIN=$(url_origin "$URL")

code=$(http_get_follow "$ORIGIN/robots.txt")
if [[ "$code" =~ ^2..$ ]]; then
  info "robots.txt present"
  exit 0
fi
warn "robots.txt missing or not reachable (HTTP $code)"
exit 1
