#!/bin/bash

# ============================================================
# SYNQRA WAITLIST - QUICK DEPLOYMENT SCRIPT
# ============================================================
# This script helps you deploy the waitlist feature step-by-step
#
# Usage: bash scripts/deploy-waitlist.sh

set -e

echo ""
echo "🎯 Synqra Waitlist Deployment"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the apps/synqra-mvp directory"
  exit 1
fi

# Step 1: Check environment variables
echo "📋 Step 1: Checking environment variables..."
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found. Creating from example..."
  cp .env.local.example .env.local
  echo "✅ Created .env.local - Please edit it with your Supabase credentials"
  echo ""
  echo "Required variables:"
  echo "  - SUPABASE_URL"
  echo "  - SUPABASE_ANON_KEY"
  echo "  - SUPABASE_SERVICE_ROLE"
  echo ""
  echo "Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
  echo ""
  read -p "Press Enter after you've updated .env.local..."
fi

# Check if variables are set
if grep -q "your-project-id" .env.local; then
  echo "⚠️  Warning: .env.local still contains placeholder values"
  echo "Please update it with real credentials before continuing"
  read -p "Press Enter when ready..."
fi

echo "✅ Environment variables configured"
echo ""

# Step 2: Install dependencies (if needed)
echo "📦 Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
echo "✅ Dependencies ready"
echo ""

# Step 3: Display SQL setup instructions
echo "🗄️  Step 3: Supabase Database Setup"
echo "-------------------------------------"
echo "1. Open your Supabase project: https://supabase.com/dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of:"
echo "   lib/posting/schema/waitlist-setup.sql"
echo "4. Click 'Run' to execute the migration"
echo ""
read -p "Press Enter when database setup is complete..."
echo "✅ Database setup complete"
echo ""

# Step 4: Test locally
echo "🧪 Step 4: Testing locally..."
echo "Starting dev server on port 3004..."
echo ""
echo "Once the server starts:"
echo "  1. Visit: http://localhost:3004/waitlist"
echo "  2. Test the form with a valid email"
echo "  3. Verify success page shows"
echo "  4. Check Supabase table for the entry"
echo ""
echo "Press Ctrl+C to stop the server when done testing"
echo ""

npm run dev:3004

# Note: Script exits here when user stops dev server
