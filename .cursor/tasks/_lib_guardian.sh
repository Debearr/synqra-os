#!/usr/bin/env bash
set -euo pipefail

# Minimal logging helpers
info()  { printf '[INFO] %s\n' "$*"; }
warn()  { printf '[WARN] %s\n' "$*"; }
error() { printf '[ERROR] %s\n' "$*"; }

# Returns a URL choosing from common envs; prefers HTTPS
# Outputs to stdout, empty if not derivable
derive_url() {
  local url="${HOMEPAGE_URL:-${PRODUCTION_URL:-${SITE_URL:-}}}"
  local domain="${DOMAIN:-}" 
  if [ -z "$url" ] && [ -n "$domain" ]; then
    if [[ "$domain" != http* ]]; then
      url="https://$domain"
    else
      url="$domain"
    fi
  fi
  if [ -z "${url:-}" ]; then
    echo ""
    return 0
  fi
  if [[ "$url" != http* ]]; then
    url="https://$url"
  fi
  echo "$url"
}

# Extract hostname from a URL (or bare host)
url_to_host() {
  local input="$1"
  local host="$input"
  if [[ "$input" == http*://* ]]; then
    host=$(echo "$input" | sed -E 's#^[a-zA-Z]+://##' | cut -d'/' -f1)
  fi
  echo "$host"
}

# Return the origin (scheme + host[:port]) of a URL or host
url_origin() {
  local input="$1"
  if [[ "$input" == http*://* ]]; then
    echo "$input" | sed -E 's#^([a-zA-Z][a-zA-Z0-9+.-]*://[^/]+).*#\1#'
  else
    echo "https://$input"
  fi
}

# Perform a HEAD request and print two lines: CODE and LOCATION (if any)
http_head() {
  local url="$1"
  local headers code location
  # Use -sS for errors, avoid following redirects; collect headers
  if ! headers=$(curl -sSI --max-time 20 --connect-timeout 10 "$url"); then
    return 1
  fi
  code=$(printf '%s\n' "$headers" | awk '/^HTTP\//{c=$2} END{print c}')
  location=$(printf '%s\n' "$headers" | awk -F": " 'tolower($1)=="location"{print $2; exit}')
  printf '%s\n' "$code"
  printf '%s\n' "${location:-}"
}

# Resolve DNS for a host; success if at least one address is found
check_dns_resolution() {
  local host="$1"
  if command -v getent >/dev/null 2>&1; then
    if getent hosts "$host" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v nslookup >/dev/null 2>&1; then
    if nslookup "$host" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v dig >/dev/null 2>&1; then
    if dig +short "$host" | grep -E '.+' >/dev/null 2>&1; then
      return 0
    fi
  fi
  # As a final fallback, try ping once
  if command -v ping >/dev/null 2>&1; then
    if ping -c 1 -W 2 "$host" >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

# Quick TLS check via curl. Exit code 0 means handshake + verification succeeded.
check_tls_handshake() {
  local host="$1"
  curl -sS -I --max-time 20 --connect-timeout 10 "https://$host" >/dev/null
}

# Fetch certificate end date (best-effort); prints raw date string if available
get_cert_enddate() {
  local host="$1"
  if ! command -v openssl >/dev/null 2>&1; then
    return 0
  fi
  # timeout prevents hangs if the host blackholes
  if command -v timeout >/dev/null 2>&1; then
    timeout 10 bash -c "</dev/null openssl s_client -servername '$host' -connect '$host:443' 2>/dev/null | openssl x509 -noout -enddate" | sed -E 's/^notAfter=//'
  else
    </dev/null openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate | sed -E 's/^notAfter=//'
  fi
}

# Fetch URL and print final HTTP code; body to stdout if requested
http_get_follow() {
  local url="$1"
  local outfile="${2:-}"
  if [ -n "$outfile" ]; then
    curl -sSL --max-time 30 --connect-timeout 10 -o "$outfile" -w "%{http_code}" "$url"
  else
    curl -sSL --max-time 30 --connect-timeout 10 -w "%{http_code}" "$url" -o /dev/null
  fi
}
