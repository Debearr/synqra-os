#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SYNQRA DEPLOYMENT VERIFICATION SUITE
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3004}"
ADMIN_TOKEN="${ADMIN_TOKEN:-change-me}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 SYNQRA DEPLOYMENT VERIFICATION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Testing: ${BASE_URL}${NC}"
echo ""

# Track results
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local expected_status="$4"
  local data="$5"

  echo -n "Testing: ${name}... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "${BASE_URL}${endpoint}")
  fi

  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ PASSED${NC} (${status_code})"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAILED${NC} (Expected: ${expected_status}, Got: ${status_code})"
    echo -e "${RED}Response: ${body}${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# ═══════════════════════════════════════════════════════════════
# HEALTH & STATUS TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━ Health & Status Tests ━━━${NC}"

test_endpoint "Enterprise Health Check" "GET" "/api/health/enterprise" "200"
test_endpoint "Model Health Check" "GET" "/api/health/models" "200"
test_endpoint "Ready Check" "GET" "/api/ready" "200"
test_endpoint "System Status" "GET" "/api/status" "200"

echo ""

# ═══════════════════════════════════════════════════════════════
# CONTENT GENERATION TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━ Content Generation Tests ━━━${NC}"

GEN_DATA='{
  "brief": "Test content generation",
  "platforms": ["LinkedIn", "YouTube"]
}'

test_endpoint "Content Generation" "POST" "/api/generate" "200" "$GEN_DATA"

# Extract job ID from response if available
if [ $? -eq 0 ]; then
  JOB_ID=$(echo "$body" | jq -r '.jobId' 2>/dev/null || echo "")
  if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
    echo -e "  ${GREEN}Job ID: ${JOB_ID}${NC}"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PUBLISHING TESTS (DRY RUN)
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━ Publishing Tests (DRY RUN) ━━━${NC}"

PUBLISH_DATA='{
  "jobId": "test-job-id",
  "platforms": ["LinkedIn"],
  "payloads": {
    "LinkedIn": {
      "text": "Test post from verification suite"
    }
  }
}'

test_endpoint "Publish Endpoint" "POST" "/api/publish" "200" "$PUBLISH_DATA"

echo ""

# ═══════════════════════════════════════════════════════════════
# OAUTH TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━ OAuth Tests ━━━${NC}"

# LinkedIn OAuth start should redirect (302 or 500 if not configured)
test_endpoint "LinkedIn OAuth Start" "GET" "/api/oauth/linkedin/start" "302" || \
test_endpoint "LinkedIn OAuth Start (unconfigured)" "GET" "/api/oauth/linkedin/start" "500"

echo ""

# ═══════════════════════════════════════════════════════════════
# ADMIN TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━ Admin Tests ━━━${NC}"

# Admin pages should be accessible
test_endpoint "Admin Dashboard" "GET" "/admin" "200"
test_endpoint "Admin Integrations" "GET" "/admin/integrations" "200"

# Approval endpoint without token should fail
APPROVE_DATA='{
  "jobId": "test-job",
  "platforms": ["LinkedIn"]
}'
test_endpoint "Approve (no token)" "POST" "/api/approve" "401" "$APPROVE_DATA"

# Approval endpoint with token
APPROVE_DATA_WITH_TOKEN='{
  "jobId": "test-job",
  "platforms": ["LinkedIn"],
  "adminToken": "'"${ADMIN_TOKEN}"'"
}'
test_endpoint "Approve (with token)" "POST" "/api/approve" "404" "$APPROVE_DATA_WITH_TOKEN" || \
test_endpoint "Approve (with token - job not found is OK)" "POST" "/api/approve" "404" "$APPROVE_DATA_WITH_TOKEN"

echo ""

# ═══════════════════════════════════════════════════════════════
# UPLOAD TESTS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━ Upload Tests ━━━${NC}"

# Upload endpoint should reject without file
test_endpoint "Upload (no file)" "POST" "/api/upload" "400"

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "Total Tests:     ${TOTAL}"
echo -e "Passed:          ${GREEN}${PASSED}${NC}"
echo -e "Failed:          ${RED}${FAILED}${NC}"
echo -e "Success Rate:    ${SUCCESS_RATE}%"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
