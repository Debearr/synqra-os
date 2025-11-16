#!/bin/bash
# ============================================================
# NØID LABS - MASTER DEPLOYMENT SCRIPT
# ============================================================
# Deploys entire ecosystem to Railway

set -e

echo "🚀 NØID Labs - Master Deployment"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗${NC} Railway CLI not installed"
    echo "Install it: npm i -g @railway/cli"
    exit 1
fi

echo -e "${BLUE}Step 1: Pre-Flight Check${NC}"
echo "-----------------------------------"
if bash scripts/pre-flight-check.sh; then
    echo -e "${GREEN}✓${NC} Pre-flight checks passed"
else
    echo -e "${RED}✗${NC} Pre-flight checks failed"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 2: Database Migrations${NC}"
echo "-----------------------------------"
if [ -n "$DATABASE_URL" ]; then
    echo "Running migrations..."
    psql "$DATABASE_URL" -f supabase/migrations/intelligence_logging.sql
    psql "$DATABASE_URL" -f supabase/migrations/rprd_infrastructure.sql
    psql "$DATABASE_URL" -f supabase/migrations/autonomous_infrastructure.sql
    psql "$DATABASE_URL" -f supabase/migrations/market_intelligence.sql
    echo -e "${GREEN}✓${NC} All migrations applied"
else
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not set, skipping migrations"
fi
echo ""

echo -e "${BLUE}Step 3: Deploy Synqra MVP${NC}"
echo "-----------------------------------"
cd apps/synqra-mvp/
railway up
echo -e "${GREEN}✓${NC} Synqra MVP deployed"
cd ../..
echo ""

echo -e "${BLUE}Step 4: Deploy NØID Dashboard${NC}"
echo "-----------------------------------"
cd noid-dashboard/
railway up
echo -e "${GREEN}✓${NC} NØID Dashboard deployed"
cd ..
echo ""

echo -e "${BLUE}Step 5: Deploy N8N Workflows${NC}"
echo "-----------------------------------"
cd n8n-workflows/
railway up
echo -e "${GREEN}✓${NC} N8N deployed"
cd ..
echo ""

echo -e "${BLUE}Step 6: Initialize Autonomous Systems${NC}"
echo "-----------------------------------"
echo "Waiting 30s for services to start..."
sleep 30

# Get deployed URLs (you'll need to configure these)
SYNQRA_URL=$(railway status --json | jq -r '.url' || echo "")

if [ -n "$SYNQRA_URL" ]; then
    echo "Testing Synqra health..."
    if curl -s "$SYNQRA_URL/api/health" | grep -q "healthy"; then
        echo -e "${GREEN}✓${NC} Synqra is healthy"
    else
        echo -e "${YELLOW}⚠${NC} Synqra health check inconclusive"
    fi
fi
echo ""

echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "📊 Deployed Services:"
echo "  - Synqra MVP: $SYNQRA_URL"
echo "  - NØID Dashboard: (check Railway dashboard)"
echo "  - N8N: (check Railway dashboard)"
echo ""
echo "🔍 Next Steps:"
echo "  1. Verify all services: railway status"
echo "  2. Monitor logs: railway logs --tail"
echo "  3. Run smoke tests: bash scripts/smoke-test.sh"
echo "  4. Update documentation with deployed URLs"
echo ""
echo -e "${GREEN}Deployment successful! 🎉${NC}"
