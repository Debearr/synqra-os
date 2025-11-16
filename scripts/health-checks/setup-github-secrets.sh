#!/bin/bash

# Enterprise Health Cell - GitHub Secrets Setup Script
# This script helps you configure GitHub repository secrets

set -e

REPO="Debearr/synqra-os"

echo "🔐 Enterprise Health Cell - GitHub Secrets Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo ""
    echo "📥 Install GitHub CLI:"
    echo "   • macOS: brew install gh"
    echo "   • Ubuntu: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "   • Windows: https://github.com/cli/cli#installation"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 MANUAL SETUP INSTRUCTIONS:"
    echo ""
    echo "1. Go to: https://github.com/$REPO/settings/secrets/actions"
    echo ""
    echo "2. Click 'New repository secret' for each of these:"
    echo ""
    echo "   Name: SUPABASE_URL"
    echo "   Value: https://tjfeindwmpuyayjvftke.supabase.co"
    echo ""
    echo "   Name: SUPABASE_ANON_KEY"
    echo "   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0"
    echo ""
    echo "   Name: SUPABASE_SERVICE_KEY"
    echo "   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI"
    echo ""
    echo "   Name: N8N_WEBHOOK_URL"
    echo "   Value: https://n8n.production.synqra.com/webhook/health-alerts"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# Check authentication
echo "🔍 Checking GitHub CLI authentication..."
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Read secrets from .env file
if [ -f "../../.env" ]; then
    source ../../.env
fi

# Set secrets
echo "🔐 Setting GitHub repository secrets..."
echo ""

# SUPABASE_URL
if [ -n "$SUPABASE_URL" ]; then
    echo "Setting SUPABASE_URL..."
    echo "$SUPABASE_URL" | gh secret set SUPABASE_URL --repo "$REPO"
    echo "✅ SUPABASE_URL set"
else
    echo "⚠️  SUPABASE_URL not found in .env"
fi

# SUPABASE_ANON_KEY
if [ -n "$SUPABASE_ANON_KEY" ]; then
    echo "Setting SUPABASE_ANON_KEY..."
    echo "$SUPABASE_ANON_KEY" | gh secret set SUPABASE_ANON_KEY --repo "$REPO"
    echo "✅ SUPABASE_ANON_KEY set"
else
    echo "⚠️  SUPABASE_ANON_KEY not found in .env"
fi

# SUPABASE_SERVICE_KEY
if [ -n "$SUPABASE_SERVICE_KEY" ]; then
    echo "Setting SUPABASE_SERVICE_KEY..."
    echo "$SUPABASE_SERVICE_KEY" | gh secret set SUPABASE_SERVICE_KEY --repo "$REPO"
    echo "✅ SUPABASE_SERVICE_KEY set"
else
    echo "⚠️  SUPABASE_SERVICE_KEY not found in .env"
fi

# N8N_WEBHOOK_URL
if [ -n "$N8N_WEBHOOK_URL" ]; then
    echo "Setting N8N_WEBHOOK_URL..."
    echo "$N8N_WEBHOOK_URL" | gh secret set N8N_WEBHOOK_URL --repo "$REPO"
    echo "✅ N8N_WEBHOOK_URL set"
else
    echo "⚠️  N8N_WEBHOOK_URL not found in .env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub secrets configured successfully!"
echo ""
echo "📋 Verify secrets:"
echo "   gh secret list --repo $REPO"
echo ""
echo "🚀 Trigger health check:"
echo "   gh workflow run enterprise-health-cell.yml --repo $REPO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
