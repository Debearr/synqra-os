#!/bin/bash
# Railway Deployment Script for Synqra OS
# Generated: 2025-11-10

set -e

echo "🚀 Synqra OS Railway Deployment Script"
echo "========================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login check
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Link to project
echo "🔗 Linking to Railway project..."
cd /workspace/apps/synqra-mvp

# Set environment variables
echo "⚙️  Setting environment variables..."
railway variables set SUPABASE_URL="https://tjfeindwmpuyayjvftke.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTg1NzYsImV4cCI6MjA3NTE5NDU3Nn0.knBEboY-VvRWUVLmCFWavQbJHo_Mpjvw6oslHlh3oi0"
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI"
railway variables set AGENT_MODE="mock"
railway variables set DEBUG_AGENTS="false"
railway variables set RAG_ENABLED="true"
railway variables set HALLUCINATION_CHECK="true"
railway variables set DUAL_PASS_VALIDATION="true"
railway variables set DRY_RUN="true"
railway variables set POSTING_ENABLED="false"
railway variables set APPROVAL_REQUIRED="true"
railway variables set DEFAULT_TIMEZONE="America/Toronto"
railway variables set NODE_ENV="production"

# Deploy
echo "📦 Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Deployment URL:"
railway domain

echo ""
echo "🔍 Checking health endpoint..."
DOMAIN=$(railway domain | grep -o 'https://[^[:space:]]*')
sleep 5
curl -s "$DOMAIN/api/health" | jq . || echo "Health check failed - service may still be starting"

echo ""
echo "✅ Railway deployment complete!"
echo "📊 Check status: railway status"
echo "📋 View logs: railway logs"
