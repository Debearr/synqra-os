#!/bin/bash
# ============================================================
# NØID LABS - PRE-FLIGHT DEPLOYMENT CHECK
# ============================================================
# Comprehensive check before deployment

set -e

echo "🚀 NØID Labs - Pre-Flight Deployment Check"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Function to check environment variable
check_env() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $1 is set"
        return 0
    fi
}

# Function to check optional env
check_env_optional() {
    if [ -z "${!1}" ]; then
        echo -e "${YELLOW}⚠${NC} Optional: $1 not set"
    else
        echo -e "${GREEN}✓${NC} $1 is set"
    fi
}

echo "Step 1: Verify Codebase Structure"
echo "-----------------------------------"
if bash scripts/verify-codebase.sh > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} All files present"
else
    echo -e "${RED}✗${NC} Missing files detected"
    ((ERRORS++))
fi
echo ""

echo "Step 2: Check Environment Variables"
echo "-----------------------------------"
check_env "ANTHROPIC_API_KEY"
check_env "SUPABASE_URL"
check_env "SUPABASE_ANON_KEY"
check_env "SUPABASE_SERVICE_ROLE_KEY"
check_env_optional "N8N_WEBHOOK_URL"
check_env_optional "SLACK_WEBHOOK_URL"
echo ""

echo "Step 3: TypeScript Compilation"
echo "-----------------------------------"
cd shared/
if npm install --silent > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install dependencies"
    ((ERRORS++))
fi

if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} TypeScript compiles without errors"
else
    echo -e "${RED}✗${NC} TypeScript compilation errors"
    npx tsc --noEmit
    ((ERRORS++))
fi
cd ..
echo ""

echo "Step 4: Database Connection"
echo "-----------------------------------"
if [ -n "$DATABASE_URL" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Database connection successful"
    else
        echo -e "${RED}✗${NC} Database connection failed"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not set, skipping DB check"
fi
echo ""

echo "Step 5: Check Git Status"
echo "-----------------------------------"
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${GREEN}✓${NC} Working tree clean"
else
    echo -e "${YELLOW}⚠${NC} Uncommitted changes detected"
    git status --short
fi
echo ""

echo "Step 6: Check Node Version"
echo "-----------------------------------"
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js version: $(node -v)"
else
    echo -e "${RED}✗${NC} Node.js version too old: $(node -v) (need v18+)"
    ((ERRORS++))
fi
echo ""

echo ""
echo "============================================"
echo "📊 PRE-FLIGHT SUMMARY"
echo "============================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: railway up"
    echo "2. Monitor: railway logs --tail"
    echo "3. Verify: curl <your-url>/api/health"
    exit 0
else
    echo -e "${RED}❌ $ERRORS CHECKS FAILED - FIX BEFORE DEPLOYMENT${NC}"
    echo ""
    echo "Review errors above and fix them before deploying."
    exit 1
fi
