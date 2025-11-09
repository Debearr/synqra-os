#!/bin/bash
# Health check probe for Synqra OS
# Curls /api/health and exits 0 on 200, non-zero otherwise

set -e

PORT="${PORT:-3004}"
HOST="${HOST:-localhost}"
URL="http://${HOST}:${PORT}/api/health"

# Perform health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${URL}" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Health check passed (HTTP $HTTP_CODE)"
  exit 0
else
  echo "✗ Health check failed (HTTP $HTTP_CODE)"
  exit 1
fi
