#!/bin/bash
# ==============================================================================
# Railway Secrets Setup Script
# ==============================================================================
# This script helps you add environment variables to Railway securely
# Requires: Railway CLI - Install: npm install -g @railway/cli
# ==============================================================================

set -e  # Exit on error

echo "🚂 Railway Environment Variables Setup for Synqra"
echo "================================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "📦 Install it: npm install -g @railway/cli"
    echo ""
    echo "After installation, run:"
    echo "  railway login"
    echo "  railway link  # Link to your project"
    echo "  ./railway-secrets-setup.sh"
    exit 1
fi

echo "✅ Railway CLI detected"
echo ""

# Check if project is linked
if ! railway status &> /dev/null; then
    echo "❌ No Railway project linked"
    echo "🔗 Please run: railway link"
    exit 1
fi

echo "✅ Railway project linked"
echo ""

# Function to set variable
set_variable() {
    local var_name=$1
    local var_desc=$2
    local is_public=$3
    
    echo "📝 Setting $var_name"
    echo "   Description: $var_desc"
    
    if [ "$is_public" = "public" ]; then
        echo "   ⚠️  Note: This will be exposed to browser (NEXT_PUBLIC_*)"
    fi
    
    echo -n "   Enter value: "
    if [ "$is_public" != "public" ]; then
        read -s var_value
        echo ""
    else
        read var_value
    fi
    
    if [ -z "$var_value" ]; then
        echo "   ⚠️  Skipped (empty value)"
    else
        railway variables set "$var_name=$var_value"
        echo "   ✅ Set successfully"
    fi
    echo ""
}

echo "This script will set the following Railway environment variables:"
echo "  1. SUPABASE_URL"
echo "  2. NEXT_PUBLIC_SUPABASE_URL"
echo "  3. SUPABASE_SERVICE_ROLE_KEY (secret)"
echo "  4. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  5. TELEGRAM_BOT_TOKEN (secret)"
echo "  6. TELEGRAM_CHANNEL_ID"
echo "  7. KIE_API_KEY (secret)"
echo "  8. KIE_PROJECT_ID"
echo "  9. PORT"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Set each variable
set_variable "SUPABASE_URL" "Supabase project URL" "public"
set_variable "NEXT_PUBLIC_SUPABASE_URL" "Supabase URL for Next.js" "public"
set_variable "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key (SECRET)" "secret"
set_variable "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase anon key for Next.js" "public"
set_variable "TELEGRAM_BOT_TOKEN" "Telegram bot token (SECRET)" "secret"
set_variable "TELEGRAM_CHANNEL_ID" "Telegram channel ID" "public"
set_variable "KIE_API_KEY" "KIE.AI API key (SECRET, optional)" "secret"
set_variable "KIE_PROJECT_ID" "KIE.AI project ID (optional)" "public"
set_variable "PORT" "Server port (default: 3004)" "public"

echo "✅ Railway environment variables setup complete!"
echo ""
echo "To verify, run:"
echo "  railway variables"
echo ""
echo "To deploy:"
echo "  railway up"
echo ""
