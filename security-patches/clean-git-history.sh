#!/bin/bash
# ==============================================================================
# Git History Cleaning Script
# ==============================================================================
# This script removes exposed secrets from git history
# ⚠️  WARNING: This rewrites git history! Backup first!
# ==============================================================================

set -e

echo "🔒 Git History Cleaning Script"
echo "=============================="
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  Make sure you have backed up your repository!"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null && ! python3 -c "import git_filter_repo" 2>/dev/null; then
    echo "📦 Installing git-filter-repo..."
    pip3 install git-filter-repo
fi

echo "🔍 Creating secrets replacement file..."
cat > /tmp/secrets-to-remove.txt << 'EOF'
# Telegram Bot Token
8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg===>TELEGRAM_BOT_TOKEN_REDACTED

# Supabase Service Role Key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI===>SUPABASE_SERVICE_ROLE_KEY_REDACTED

# Supabase Anon Key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0===>SUPABASE_ANON_KEY_REDACTED

# Supabase Access Token
sbp_afe61dcb391bc9492215e85afe2ddac98a40fa5f===>SUPABASE_ACCESS_TOKEN_REDACTED

# KIE.AI API Key  
5b5ff66e8d17208306dd84053c5e8a55===>KIE_API_KEY_REDACTED
EOF

echo "🧹 Removing .env files from history..."
git filter-repo --path scripts/health-checks/.env --invert-paths --force

echo "🔄 Replacing exposed secrets in history..."
git filter-repo --replace-text /tmp/secrets-to-remove.txt --force

echo "✅ Git history cleaned!"
echo ""
echo "📊 Summary:"
git log --oneline | head -10
echo ""
echo "⚠️  To complete the process, force push:"
echo "    git push --force-with-lease origin feature/flickengine-addon"
echo ""
echo "🔐 Don't forget to:"
echo "  1. Rotate the Telegram bot token"
echo "  2. Update GitHub secrets"
echo "  3. Update Railway environment variables"
echo ""

# Cleanup
rm /tmp/secrets-to-remove.txt
