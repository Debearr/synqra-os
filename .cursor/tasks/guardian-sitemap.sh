#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/_lib_guardian.sh"

URL=$(derive_url)
if [ -z "$URL" ]; then
  warn "No URL env provided; skipping sitemap check"; exit 0
fi
ORIGIN=$(url_origin "$URL")
HOST=$(url_to_host "$URL")

# Try common sitemap locations
CANDIDATES=(
  "$ORIGIN/sitemap.xml"
  "$ORIGIN/sitemap_index.xml"
  "$ORIGIN/sitemap/sitemap.xml"
)

found=0
for s in "${CANDIDATES[@]}"; do
  code=$(http_get_follow "$s")
  if [[ "$code" =~ ^2..$ ]]; then
    info "Sitemap found at $s"
    found=1
    break
  fi
  warn "No sitemap at $s (HTTP $code)"

done

if [ "$found" -eq 0 ]; then
  error "No sitemap detected for $HOST"
  exit 1
fi
