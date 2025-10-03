#!/bin/bash
# 🚦 Synqra Railway Sanity Check Script

# Auto-detect Railway deployment URL
RAILWAY_URL=$(railway status | grep -Eo 'https://[a-zA-Z0-9.-]+\.railway\.app')

if [ -z "$RAILWAY_URL" ]; then
  echo "❌ Could not detect Railway URL. Run 'railway up' first."
  exit 1
fi

echo "✅ Using Railway URL: $RAILWAY_URL"
echo "----------------------------------"

# 1. Logs Health Check
echo "📜 Checking recent logs..."
railway logs --tail=20 || { echo "❌ Logs check failed"; exit 1; }

# 2. Database Migration Status
echo "🗄️ Checking Supabase migrations..."
railway run supabase migrate status || { echo "❌ Migration status failed"; exit 1; }

# 3. Secrets / Env Vars
echo "🔑 Checking environment variables..."
railway variables list || { echo "❌ Env vars check failed"; exit 1; }

# 4. Worker Queue Functionality
echo "⚙️ Enqueuing test job..."
railway run npm run enqueue:test || { echo "❌ Enqueue test failed"; exit 1; }

# 5. Health Endpoint
echo "🌐 Pinging health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $RAILWAY_URL/health)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Health endpoint responded with 200"
else
  echo "❌ Health endpoint failed (HTTP $HTTP_CODE)"
  exit 1
fi

echo "----------------------------------"
echo "🎉 All sanity checks passed! Synqra is production-ready."

