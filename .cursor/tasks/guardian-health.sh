#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/_lib_guardian.sh"

URL=$(derive_url)
if [ -z "$URL" ]; then
  warn "No URL env provided; skipping health check"; exit 0
fi
ORIGIN=$(url_origin "$URL")

# Try common health endpoints
CANDIDATES=(
  "$ORIGIN/health"
  "$ORIGIN/healthz"
  "$ORIGIN/api/health"
)

ok=0
for h in "${CANDIDATES[@]}"; do
  code=$(http_get_follow "$h")
  if [[ "$code" =~ ^2..$ ]]; then
    info "Health endpoint OK at $h"
    ok=1
    break
  fi
  warn "Health not found at $h (HTTP $code)"

done

if [ "$ok" -eq 0 ]; then
  error "No healthy endpoint responded with 2xx"
  exit 1
fi
