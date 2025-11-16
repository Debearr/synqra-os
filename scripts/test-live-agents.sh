#!/bin/bash
# Test script for Live Agent Mode
# Tests all three agents with real Claude API integration

echo "🧪 Testing Synqra Agents in LIVE MODE"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local message=$3

    echo -e "${YELLOW}Testing: $name${NC}"
    echo "Endpoint: $endpoint"
    echo "Message: $message"
    echo ""

    response=$(curl -s -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\"}" \
        -w "\nHTTP_STATUS:%{http_code}")

    # Extract status code
    status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')

    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ SUCCESS${NC} (HTTP $status)"

        # Check if response contains expected fields
        if echo "$body" | grep -q "\"answer\"" && echo "$body" | grep -q "\"confidence\""; then
            echo -e "${GREEN}✓ Response format valid${NC}"

            # Extract agent mode
            mode=$(echo "$body" | grep -o '"mode":"[^"]*"' | cut -d: -f2 | tr -d '"')
            if [ "$mode" = "live" ]; then
                echo -e "${GREEN}✓ LIVE MODE confirmed${NC}"
            else
                echo -e "${YELLOW}⚠ Mode: $mode (expected: live)${NC}"
            fi

            # Show answer preview
            answer=$(echo "$body" | grep -o '"answer":"[^"]*"' | cut -d: -f2 | tr -d '"' | head -c 100)
            echo "Answer preview: ${answer}..."

            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ Invalid response format${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $status)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    echo ""
    echo "---"
    echo ""
}

# Start server in background (if not already running)
echo "Checking if server is running..."
if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo "Starting development server..."
    cd /home/user/synqra-os/apps/synqra-mvp
    npm run dev > /tmp/synqra-dev.log 2>&1 &
    SERVER_PID=$!
    echo "Server PID: $SERVER_PID"

    # Wait for server to start
    echo "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
            echo -e "${GREEN}Server is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
else
    echo -e "${GREEN}Server already running${NC}"
    SERVER_PID=""
fi

echo ""

# Test Health Endpoint
echo "=== Testing Health Endpoint ==="
health_response=$(curl -s "$BASE_URL/api/health")
if echo "$health_response" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$health_response" | grep -o '"mode":"[^"]*"'
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$health_response"
fi
echo ""
echo "---"
echo ""

# Test Auto-Routing
test_endpoint \
    "Auto-Routing (Sales Query)" \
    "/api/agents" \
    "How much does Synqra cost?"

test_endpoint \
    "Auto-Routing (Support Query)" \
    "/api/agents" \
    "I can't log in to my account"

test_endpoint \
    "Auto-Routing (Service Query)" \
    "/api/agents" \
    "I want to upgrade my plan"

# Test Direct Sales Agent
test_endpoint \
    "Sales Agent Direct" \
    "/api/agents/sales" \
    "Can I schedule a demo?"

# Test Direct Support Agent
test_endpoint \
    "Support Agent Direct" \
    "/api/agents/support" \
    "The API is returning 401 errors"

# Test Direct Service Agent
test_endpoint \
    "Service Agent Direct" \
    "/api/agents/service" \
    "How do I cancel my subscription?"

# Summary
echo ""
echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit http://localhost:3000/agents to test in browser"
    echo "2. Deploy to Railway with: ./scripts/configure-railway.sh"
    echo "3. Test production at: https://synqra.co/agents"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo "Check the logs for details"
fi

# Cleanup
if [ -n "$SERVER_PID" ]; then
    echo ""
    echo "Server is still running (PID: $SERVER_PID)"
    echo "To stop: kill $SERVER_PID"
fi
