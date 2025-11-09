#!/bin/bash
# Railway Environment Configuration Script
# Run this to configure Railway with production environment variables

echo "🚀 Configuring Railway Environment Variables..."
echo ""

# Check if .env.railway exists
if [ ! -f ".env.railway" ]; then
    echo "❌ Error: .env.railway file not found!"
    echo ""
    echo "Please create .env.railway with your API keys:"
    echo ""
    echo "ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE"
    echo "SUPABASE_URL=https://YOUR_PROJECT.supabase.co"
    echo "SUPABASE_ANON_KEY=YOUR_ANON_KEY"
    echo ""
    exit 1
fi

# Load environment variables from .env.railway
source .env.railway

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm i -g @railway/cli
fi

# Login to Railway (if needed)
echo "🔐 Logging in to Railway..."
railway login

# Set environment variables for Synqra OS production
echo "⚙️  Setting environment variables..."

# Anthropic/Claude API
railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
railway variables set ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
railway variables set AGENT_MODE="live"

# Agent Configuration
railway variables set AGENT_MAX_TOKENS="4096"
railway variables set AGENT_TEMPERATURE="0.7"

# RAG Configuration
railway variables set RAG_ENABLED="true"
railway variables set RAG_MAX_DOCUMENTS="5"
railway variables set RAG_MIN_SIMILARITY="0.7"

# Memory Configuration
railway variables set CONVERSATION_HISTORY_LIMIT="20"

# Safety Configuration
railway variables set HALLUCINATION_CHECK="true"
railway variables set DUAL_PASS_VALIDATION="true"
railway variables set MIN_CONFIDENCE_THRESHOLD="0.6"

# Production Settings
railway variables set DEBUG_AGENTS="false"
railway variables set NODE_ENV="production"

# Supabase (Optional)
if [ -n "$SUPABASE_URL" ]; then
    railway variables set SUPABASE_URL="$SUPABASE_URL"
    railway variables set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
fi

echo "✅ Environment variables configured!"
echo ""
echo "📊 Current Railway environment:"
railway variables

echo ""
echo "🎉 Configuration complete! Railway will auto-redeploy with live mode enabled."
echo ""
echo "⚠️  IMPORTANT SECURITY REMINDER:"
echo "   1. Rotate your Anthropic API key after this session"
echo "   2. Never commit .env.railway to Git (it's in .gitignore)"
echo "   3. Use Railway's encrypted variables for secrets"
echo ""
echo "🔗 Next steps:"
echo "   1. Monitor deployment: railway logs"
echo "   2. Test health: curl https://synqra.co/api/health"
echo "   3. Test agents: https://synqra.co/agents"
