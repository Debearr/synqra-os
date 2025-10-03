#!/usr/bin/env bash
set -euo pipefail

if ! command -v railway >/dev/null 2>&1; then
  echo "railway CLI not found. Install with: npm i -g @railway/cli" >&2
  exit 1
fi

if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  echo "RAILWAY_TOKEN not set; authentication may fail for non-interactive shells." >&2
fi

RAILWAY_URL=$(railway status | grep -Eo 'https://[a-zA-Z0-9.-]+\.railway\.app' | head -n1 || true)
if [[ -z "${RAILWAY_URL}" ]]; then
  echo "Could not auto-detect Railway URL from 'railway status'." >&2
  exit 1
fi

echo "Using Railway URL: ${RAILWAY_URL}"

railway logs --tail=20
railway run supabase migrate status
railway variables list
railway run npm run enqueue:test
curl -s -o /dev/null -w "%{http_code}\n" "${RAILWAY_URL}/health"

