#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SYNQRA API TESTING SCRIPT
# Quick tests for local development
# ═══════════════════════════════════════════════════════════════

BASE_URL="${1:-http://localhost:3004}"

echo "🧪 Testing Synqra API at ${BASE_URL}"
echo ""

# 1. Test content generation
echo "1️⃣  Testing content generation..."
GEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Share our new AI-powered content creation tool",
    "platforms": ["LinkedIn", "YouTube", "TikTok"]
  }')

echo "$GEN_RESPONSE" | jq '.'
JOB_ID=$(echo "$GEN_RESPONSE" | jq -r '.jobId')
echo "Job ID: $JOB_ID"
echo ""

# 2. Test status endpoint
echo "2️⃣  Testing status endpoint..."
curl -s "${BASE_URL}/api/status" | jq '.'
echo ""

# 3. Test publish endpoint (dry run)
echo "3️⃣  Testing publish endpoint (DRY_RUN)..."
PUBLISH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/publish" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"${JOB_ID}\",
    \"platforms\": [\"LinkedIn\"],
    \"payloads\": {
      \"LinkedIn\": {
        \"text\": \"Test post from Synqra API test script\"
      }
    }
  }")

echo "$PUBLISH_RESPONSE" | jq '.'
echo ""

# 4. Test health
echo "4️⃣  Testing health endpoint..."
curl -s "${BASE_URL}/api/health" | jq '.'
echo ""

echo "✅ API tests complete"
