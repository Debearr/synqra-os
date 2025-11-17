#!/bin/bash

# ============================================================================
# GitHub Secrets Setup Script
# ============================================================================
# This script automatically configures GitHub Actions secrets for the
# Enterprise Health Cell system using the gh CLI.
#
# Prerequisites:
#   - gh CLI installed (https://cli.github.com/)
#   - gh auth login completed
#   - .env file with all required variables
# ============================================================================

set -e

echo "🔐 GitHub Secrets Setup for Enterprise Health Cell"
echo "=================================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Please install it:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   sudo apt install gh"
    echo "  Windows: choco install gh"
    echo ""
    echo "Then run: gh auth login"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo ""
    echo "Please run: gh auth login"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo ""
    echo "Please create .env file with all required variables"
    exit 1
fi

# Load environment variables
source .env

echo "📋 Checking required environment variables..."
echo ""

# Function to check if variable is set
check_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo "  ✗ $var_name (missing)"
        return 1
    else
        echo "  ✓ $var_name"
        return 0
    fi
}

# Check all required variables
all_present=true

check_var "SUPABASE_URL" || all_present=false
check_var "SUPABASE_SERVICE_KEY" || all_present=false
check_var "SUPABASE_ANON_KEY" || all_present=false
check_var "N8N_WEBHOOK_URL" || all_present=false
check_var "TELEGRAM_BOT_TOKEN" || all_present=false
check_var "TELEGRAM_CHANNEL_ID" || all_present=false

echo ""

if [ "$all_present" = false ]; then
    echo "❌ Some required variables are missing in .env"
    echo ""
    echo "Please add all required variables to .env file"
    exit 1
fi

echo "✅ All required variables present"
echo ""

# Get repository (current directory)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo "❌ Could not detect GitHub repository"
    echo ""
    echo "Please run this script from within your Git repository"
    exit 1
fi

echo "📦 Repository: $REPO"
echo ""

# Confirm before proceeding
echo "⚠️  This will set/update the following secrets in $REPO:"
echo ""
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_KEY"
echo "  - SUPABASE_ANON_KEY"
echo "  - N8N_WEBHOOK_URL"
echo "  - TELEGRAM_BOT_TOKEN"
echo "  - TELEGRAM_CHANNEL_ID"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🔒 Setting GitHub Actions secrets..."
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_value=$2

    if echo "$secret_value" | gh secret set "$secret_name" --repo="$REPO"; then
        echo "  ✓ $secret_name"
        return 0
    else
        echo "  ✗ $secret_name (failed)"
        return 1
    fi
}

# Set all secrets
set_secret "SUPABASE_URL" "$SUPABASE_URL"
set_secret "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY"
set_secret "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
set_secret "N8N_WEBHOOK_URL" "$N8N_WEBHOOK_URL"
set_secret "TELEGRAM_BOT_TOKEN" "$TELEGRAM_BOT_TOKEN"
set_secret "TELEGRAM_CHANNEL_ID" "$TELEGRAM_CHANNEL_ID"

echo ""
echo "✅ GitHub secrets configured successfully!"
echo ""
echo "🔗 View secrets at:"
echo "   https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "🚀 Next steps:"
echo "   1. Apply database migration (see DEPLOYMENT_GUIDE.md)"
echo "   2. Test workflow: gh workflow run enterprise-health-cell.yml"
echo "   3. Monitor: https://github.com/$REPO/actions"
echo ""
