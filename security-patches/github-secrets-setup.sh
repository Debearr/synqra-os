#!/bin/bash
# ==============================================================================
# GitHub Secrets Setup Script
# ==============================================================================
# This script helps you add secrets to your GitHub repository securely
# Requires: GitHub CLI (gh) - Install: https://cli.github.com/
# ==============================================================================

set -e  # Exit on error

echo "🔐 GitHub Secrets Setup for Synqra"
echo "=================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "📦 Install it from: https://cli.github.com/"
    echo ""
    echo "After installation, run:"
    echo "  gh auth login"
    echo "  ./github-secrets-setup.sh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "🔑 Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI detected and authenticated"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_desc=$2
    
    echo "📝 Setting $secret_name"
    echo "   Description: $secret_desc"
    echo -n "   Enter value (input hidden): "
    read -s secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "   ⚠️  Skipped (empty value)"
    else
        gh secret set "$secret_name" --body "$secret_value"
        echo "   ✅ Set successfully"
    fi
    echo ""
}

echo "This script will set the following GitHub Secrets:"
echo "  1. SUPABASE_URL"
echo "  2. SUPABASE_SERVICE_KEY"
echo "  3. SUPABASE_ANON_KEY"
echo "  4. TELEGRAM_BOT_TOKEN"
echo "  5. TELEGRAM_CHANNEL_ID"
echo "  6. KIE_API_KEY"
echo "  7. KIE_PROJECT_ID"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Set each secret
set_secret "SUPABASE_URL" "Your Supabase project URL (e.g., https://xxx.supabase.co)"
set_secret "SUPABASE_SERVICE_KEY" "Supabase service role key (from Dashboard → Settings → API)"
set_secret "SUPABASE_ANON_KEY" "Supabase anon key (from Dashboard → Settings → API)"
set_secret "TELEGRAM_BOT_TOKEN" "Telegram bot token (from @BotFather)"
set_secret "TELEGRAM_CHANNEL_ID" "Telegram channel ID (e.g., @YourChannel)"
set_secret "KIE_API_KEY" "KIE.AI API key (optional)"
set_secret "KIE_PROJECT_ID" "KIE.AI project ID (optional)"

echo "✅ GitHub Secrets setup complete!"
echo ""
echo "To verify, run:"
echo "  gh secret list"
echo ""
echo "To test the workflow:"
echo "  gh workflow run supabase-health.yml"
echo ""
