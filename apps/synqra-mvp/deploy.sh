#!/usr/bin/env bash
# Non-interactive Vercel deployment for apps/synqra-mvp.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_var VERCEL_TOKEN
require_var VERCEL_ORG_ID
require_var VERCEL_PROJECT_ID

echo "Deploying synqra-mvp to Vercel (non-interactive)..."
pnpm dlx vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
pnpm dlx vercel build --prod --token="$VERCEL_TOKEN"
pnpm dlx vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"

echo "Deployment command sequence completed."
