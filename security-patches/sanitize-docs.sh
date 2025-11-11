#!/bin/bash
# ==============================================================================
# Documentation Sanitization Script
# ==============================================================================
# This script removes exposed secrets from markdown documentation files
# ==============================================================================

set -e

echo "🧹 Documentation Sanitization Script"
echo "===================================="
echo ""

# Define exposed secrets (escaped for sed)
TELEGRAM_TOKEN="8369994671:AAEmB2bJ2frgbPXYFy3oUO5a2u-7brzkxPg"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ\.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0\.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0"

# Files to sanitize
FILES=(
  "ENVIRONMENT_SETUP.md"
  "TASK_COMPLETION_SUMMARY.md"
  "ALL_SYSTEMS_READY_REPORT.md"
  "RAILWAY-DEPLOYMENT-GUIDE.md"
  "START-HERE.md"
  "COMPLETE.md"
  "DEPLOYMENT.md"
  "QUICK-START-GUIDE.md"
)

echo "📝 Sanitizing files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  🔄 Processing: $file"
    
    # Replace Telegram token
    sed -i.bak "s/$TELEGRAM_TOKEN/YOUR_BOT_ID:YOUR_BOT_TOKEN/g" "$file"
    
    # Replace Service Role Key
    sed -i.bak "s/$SERVICE_KEY/your_supabase_service_role_key_here/g" "$file"
    
    # Replace Anon Key
    sed -i.bak "s/$ANON_KEY/your_supabase_anon_key_here/g" "$file"
    
    # Remove backup file
    rm -f "$file.bak"
    
    echo "  ✅ Sanitized: $file"
  else
    echo "  ⚠️  Not found: $file (skipping)"
  fi
done

echo ""
echo "✅ Sanitization complete!"
echo ""
echo "📊 Changes summary:"
git diff --stat
echo ""
echo "🔍 Review changes:"
echo "   git diff"
echo ""
echo "💾 Commit changes:"
echo "   git add -A"
echo "   git commit -m 'security: remove remaining exposed secrets from documentation'"
echo ""
