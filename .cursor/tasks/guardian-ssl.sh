#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/_lib_guardian.sh"

URL=$(derive_url)
if [ -z "$URL" ]; then
  warn "No URL env provided; skipping SSL check"; exit 0
fi
HOST=$(url_to_host "$URL")

if check_tls_handshake "$HOST"; then
  info "TLS handshake OK for $HOST"
else
  error "TLS handshake FAILED for $HOST"
  exit 1
fi

ENDDATE=$(get_cert_enddate "$HOST" || true)
if [ -n "${ENDDATE:-}" ]; then
  info "Certificate expires: $ENDDATE"
fi
