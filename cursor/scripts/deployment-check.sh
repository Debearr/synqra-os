#!/usr/bin/env bash
set -euo pipefail

# Quick script to confirm Railway project deployment + DNS verification status

# --- CONFIG ---
NOID_PROJECT="noid-app"
SYNQRA_PROJECT="synqra-app"

# --- Helpers ---
err() { echo "[error] $*" >&2; }
section() { echo -e "\n\033[1m$*\033[0m"; }

# --- Preconditions ---
if ! command -v railway >/dev/null 2>&1; then
  err "Railway CLI not found. Install from https://docs.railway.com/reference/cli or 'npm i -g @railway/cli'"
  exit 127
fi

section "🔍 Checking Railway deployment status for NØID and SYNQRA..."

# --- FETCH DEPLOYMENT STATUS ---
section "NØID: deployment status"
railway status --project "$NOID_PROJECT" || err "Failed to fetch status for $NOID_PROJECT"

section "SYNQRA: deployment status"
railway status --project "$SYNQRA_PROJECT" || err "Failed to fetch status for $SYNQRA_PROJECT"

# --- VERIFY DNS CONFIGURATION ---
section "🔎 Verifying custom domain records..."
section "NØID: domains"
railway domains --project "$NOID_PROJECT" || err "Failed to fetch domains for $NOID_PROJECT"

section "SYNQRA: domains"
railway domains --project "$SYNQRA_PROJECT" || err "Failed to fetch domains for $SYNQRA_PROJECT"

# --- OUTPUT CLEAN URLS ---
section "🌐 Current public URLs:"
{
  echo -n "NØID:   "; railway open --project "$NOID_PROJECT"
  echo -n "SYNQRA: "; railway open --project "$SYNQRA_PROJECT"
} || err "Failed to open one or more projects"

section "✅ Deployment and DNS verification complete."
