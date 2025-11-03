#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Starting Pre-Deploy Safety Checks...${NC}\n"

# Change to noid-dashboard directory
cd noid-dashboard

# 1. Validate File Structure
echo -e "${YELLOW}📁 Validating file structure...${NC}"
required_files=(
    "package.json"
    "next.config.ts"
    "app/layout.tsx"
    "app/page.tsx"
    "app/api/health/route.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ File structure validated${NC}\n"

# 2. Install Dependencies (if needed)
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}\n"
fi

# 3. Test Build Locally
echo -e "${YELLOW}🔨 Testing production build...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}\n"

# 4. Test Server Starts
echo -e "${YELLOW}🚀 Testing server startup...${NC}"

# Start the server in the background
npm run start > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Give server time to start
sleep 5

# Check if process is still running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Server failed to start!${NC}"
    cat /tmp/server.log
    exit 1
fi
echo -e "${GREEN}✅ Server started successfully (PID: $SERVER_PID)${NC}\n"

# 5. Check Port Responds
echo -e "${YELLOW}🌐 Testing server response...${NC}"

# Test health endpoint
max_attempts=10
attempt=0
success=false

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success=true
        break
    fi
    attempt=$((attempt + 1))
    sleep 1
done

if [ "$success" = false ]; then
    echo -e "${RED}❌ Health check failed!${NC}"
    cat /tmp/server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Test main page
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Main page not responding!${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Server responding on port 3000${NC}\n"

# Cleanup: Stop the server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ALL PRE-DEPLOY CHECKS PASSED!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "${GREEN}Safe to deploy! 🚀${NC}\n"

exit 0
