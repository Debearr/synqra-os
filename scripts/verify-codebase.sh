#!/bin/bash
# ============================================================
# NØID LABS - CODEBASE VERIFICATION SCRIPT
# ============================================================
# Verifies all critical files exist before deployment

set -e  # Exit on any error

echo "🔍 NØID Labs - Codebase Verification"
echo "===================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} MISSING: $1"
        ((ERRORS++))
        return 1
    fi
}

# Function to check directory
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} MISSING DIR: $1/"
        ((ERRORS++))
        return 1
    fi
}

# Function to check optional file
check_optional() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${YELLOW}⚠${NC} Optional: $1"
        ((WARNINGS++))
    fi
}

echo "📁 Checking Directory Structure..."
echo "-----------------------------------"
check_dir "shared"
check_dir "shared/ai"
check_dir "shared/rprd"
check_dir "shared/db"
check_dir "shared/prompts"
check_dir "shared/types"
check_dir "shared/validation"
check_dir "shared/workflows"
check_dir "shared/cache"
check_dir "shared/optimization"
check_dir "shared/autonomous"
check_dir "shared/intelligence"
check_dir "shared/orchestration"
check_dir "shared/dev"
check_dir "shared/components"
check_dir "shared/components/luxgrid"
check_dir "supabase/migrations"
check_dir "n8n-workflows"
echo ""

echo "📄 Checking Core Shared Files..."
echo "-----------------------------------"
check_file "shared/index.ts"
check_file "shared/package.json"
check_file "shared/tsconfig.json"
check_file "shared/README.md"
echo ""

echo "🤖 Checking AI & Content..."
echo "-----------------------------------"
check_file "shared/ai/client.ts"
check_file "shared/rprd/patterns.ts"
check_file "shared/prompts/library.ts"
check_file "shared/validation/index.ts"
echo ""

echo "💾 Checking Data & Intelligence..."
echo "-----------------------------------"
check_file "shared/db/supabase.ts"
check_file "shared/types/index.ts"
check_file "shared/cache/intelligent-cache.ts"
echo ""

echo "⚙️  Checking Workflows & Orchestration..."
echo "-----------------------------------"
check_file "shared/workflows/orchestrator.ts"
check_file "shared/orchestration/system-coordinator.ts"
echo ""

echo "🔄 Checking Autonomous Systems..."
echo "-----------------------------------"
check_file "shared/autonomous/self-healing.ts"
check_file "shared/autonomous/evolving-agents.ts"
echo ""

echo "📊 Checking Market Intelligence..."
echo "-----------------------------------"
check_file "shared/intelligence/market-watch.ts"
check_file "shared/intelligence/scrapers.ts"
check_file "shared/intelligence/decision-engine.ts"
echo ""

echo "⚡ Checking Optimization..."
echo "-----------------------------------"
check_file "shared/optimization/auto-optimizer.ts"
check_file "shared/dev/tools.ts"
echo ""

echo "🗄️  Checking Database Migrations..."
echo "-----------------------------------"
check_file "supabase/migrations/intelligence_logging.sql"
check_file "supabase/migrations/rprd_infrastructure.sql"
check_file "supabase/migrations/autonomous_infrastructure.sql"
check_file "supabase/migrations/market_intelligence.sql"
echo ""

echo "📚 Checking Documentation..."
echo "-----------------------------------"
check_file "DEPLOYMENT-CHECKLIST.md"
check_file "SYSTEM-ARCHITECTURE.md"
check_optional "RPRD-DNA-UPGRADE-COMPLETE.md"
check_optional "AUTONOMOUS-SYSTEM-COMPLETE.md"
check_optional "NOID-LABS-UPGRADE-MASTER.md"
check_optional "README.md"
echo ""

echo "🔧 Checking Configuration Files..."
echo "-----------------------------------"
check_file ".env.example"
check_file ".gitignore"
check_optional "railway.json"
check_optional "nixpacks.toml"
echo ""

echo "🎨 Checking UI Components..."
echo "-----------------------------------"
check_optional "shared/components/luxgrid/Button.tsx"
check_optional "shared/components/luxgrid/Card.tsx"
check_optional "shared/components/luxgrid/Grid.tsx"
echo ""

echo ""
echo "============================================"
echo "📊 VERIFICATION SUMMARY"
echo "============================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical files present${NC}"
else
    echo -e "${RED}✗ $ERRORS critical files missing${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS optional files missing (non-critical)${NC}"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ CODEBASE READY FOR DEPLOYMENT${NC}"
    exit 0
else
    echo -e "${RED}❌ FIX MISSING FILES BEFORE DEPLOYMENT${NC}"
    exit 1
fi
