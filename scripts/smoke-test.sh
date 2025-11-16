#!/bin/bash
# ============================================================
# NØID LABS - POST-DEPLOYMENT SMOKE TESTS
# ============================================================
# Quick verification that all systems are running

set -e

echo "🔬 NØID Labs - Post-Deployment Smoke Tests"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local NAME=$1
    local URL=$2
    local EXPECTED=$3
    
    echo -n "Testing $NAME... "
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$URL" 2>/dev/null || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "$EXPECTED" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $HTTP_CODE)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $HTTP_CODE, expected $EXPECTED)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Get URLs from environment or prompt
SYNQRA_URL=${SYNQRA_URL:-""}
NOID_URL=${NOID_URL:-""}
N8N_URL=${N8N_URL:-""}

if [ -z "$SYNQRA_URL" ]; then
    read -p "Enter Synqra URL (or skip): " SYNQRA_URL
fi

if [ -z "$NOID_URL" ]; then
    read -p "Enter NØID Dashboard URL (or skip): " NOID_URL
fi

if [ -z "$N8N_URL" ]; then
    read -p "Enter N8N URL (or skip): " N8N_URL
fi

echo ""
echo "Running tests..."
echo "-----------------------------------"

# Test Synqra
if [ -n "$SYNQRA_URL" ]; then
    test_endpoint "Synqra Health" "$SYNQRA_URL/api/health" "200"
    test_endpoint "Synqra Home" "$SYNQRA_URL" "200"
else
    echo -e "${YELLOW}⚠${NC} Skipping Synqra tests (no URL provided)"
fi

# Test NØID Dashboard
if [ -n "$NOID_URL" ]; then
    test_endpoint "NØID Home" "$NOID_URL" "200"
else
    echo -e "${YELLOW}⚠${NC} Skipping NØID tests (no URL provided)"
fi

# Test N8N
if [ -n "$N8N_URL" ]; then
    test_endpoint "N8N Health" "$N8N_URL/healthz" "200"
else
    echo -e "${YELLOW}⚠${NC} Skipping N8N tests (no URL provided)"
fi

# Test Database (if URL provided)
if [ -n "$DATABASE_URL" ]; then
    echo -n "Testing Database Connection... "
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC}"
        ((TESTS_FAILED++))
    fi
fi

echo ""
echo "============================================"
echo "📊 SMOKE TEST SUMMARY"
echo "============================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL SMOKE TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED - INVESTIGATE${NC}"
    exit 1
fi
