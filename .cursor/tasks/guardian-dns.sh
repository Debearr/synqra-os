#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/_lib_guardian.sh"

URL=$(derive_url)
if [ -z "$URL" ]; then
  warn "No URL env provided; skipping DNS check"; exit 0
fi
HOST=$(url_to_host "$URL")

if check_dns_resolution "$HOST"; then
  info "DNS resolution OK for $HOST"
else
  error "DNS resolution FAILED for $HOST"
  exit 1
fi
