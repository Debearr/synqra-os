#!/bin/bash

# ═══════════════════════════════════════════════════════════
# SYNQRA OS - COMPLETE SETUP AND RUN SCRIPT
# ═══════════════════════════════════════════════════════════

set -e  # Exit on any error

echo ""
echo "🚀 SYNQRA OS - COMPLETE SETUP AND RUN"
echo "════════════════════════════════════════════════════════"
echo ""

# ============================================================
# STEP 1: Check Prerequisites
# ============================================================
echo "📋 STEP 1: Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version) found"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed!"
    exit 1
fi
echo "✅ npm $(npm --version) found"

echo ""

# ============================================================
# STEP 2: Install Root Dependencies
# ============================================================
echo "📦 STEP 2: Installing root dependencies..."

if [ -f "package.json" ]; then
    npm install
    echo "✅ Root dependencies installed"
else
    echo "⚠️  No root package.json found, skipping..."
fi

echo ""

# ============================================================
# STEP 3: Setup NOID Dashboard
# ============================================================
echo "🎨 STEP 3: Setting up NOID Dashboard..."

if [ -d "noid-dashboard" ]; then
    cd noid-dashboard

    # Install dependencies
    if [ -f "package.json" ]; then
        echo "Installing NOID Dashboard dependencies..."
        npm install
        echo "✅ NOID Dashboard dependencies installed"
    fi

    cd ..
else
    echo "⚠️  noid-dashboard directory not found, skipping..."
fi

echo ""

# ============================================================
# STEP 4: Setup Health Checks Dashboard
# ============================================================
echo "🏥 STEP 4: Setting up Health Checks Dashboard..."

if [ -d "scripts/health-checks" ]; then
    cd scripts/health-checks

    # Install dependencies
    if [ -f "package.json" ]; then
        echo "Installing Health Checks dependencies..."
        npm install
        echo "✅ Health Checks dependencies installed"
    fi

    cd ../..
else
    echo "⚠️  scripts/health-checks directory not found, skipping..."
fi

echo ""

# ============================================================
# STEP 5: Check Environment Configuration
# ============================================================
echo "⚙️  STEP 5: Checking environment configuration..."

if [ -f ".env" ]; then
    echo "✅ .env file found"

    # Check for required variables
    if grep -q "SUPABASE_URL=" .env && grep -q "SUPABASE_SERVICE_KEY=" .env; then
        echo "✅ Supabase configuration detected"
    else
        echo "⚠️  Warning: Missing Supabase configuration in .env"
    fi

    if grep -q "LINKEDIN_ACCESS_TOKEN=" .env; then
        echo "✅ LinkedIn configuration detected"
    else
        echo "⚠️  Warning: Missing LinkedIn configuration in .env"
    fi
else
    echo "⚠️  No .env file found - some features may not work"
fi

echo ""

# ============================================================
# SETUP COMPLETE - Display Information
# ============================================================
echo ""
echo "════════════════════════════════════════════════════════"
echo "✨ SETUP COMPLETE!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📦 INSTALLED COMPONENTS:"
echo "   ✓ Root dependencies"
echo "   ✓ NOID Dashboard (Next.js)"
echo "   ✓ Health Checks Dashboard (Next.js)"
echo ""

# ============================================================
# STEP 6: Run the Applications
# ============================================================
echo "🚀 STEP 6: Starting applications..."
echo ""
echo "════════════════════════════════════════════════════════"
echo "STARTING SERVICES"
echo "════════════════════════════════════════════════════════"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "⏹️  Shutting down services..."
    jobs -p | xargs -r kill 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start Health Checks Dashboard (port 3003)
if [ -d "scripts/health-checks" ]; then
    echo "🏥 Starting Health Checks Dashboard on port 3003..."
    cd scripts/health-checks
    npm run dev > /tmp/health-checks.log 2>&1 &
    HEALTH_PID=$!
    cd ../..
    echo "   └─ PID: $HEALTH_PID"
    echo "   └─ URL: http://localhost:3003"
    echo ""
fi

# Start NOID Dashboard (port 3000)
if [ -d "noid-dashboard" ]; then
    echo "🎨 Starting NOID Dashboard on port 3000..."
    cd noid-dashboard
    npm run dev > /tmp/noid-dashboard.log 2>&1 &
    NOID_PID=$!
    cd ..
    echo "   └─ PID: $NOID_PID"
    echo "   └─ URL: http://localhost:3000"
    echo ""
fi

# Wait a moment for services to start
sleep 3

echo "════════════════════════════════════════════════════════"
echo "✅ ALL SERVICES RUNNING"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 AVAILABLE DASHBOARDS:"
echo ""
echo "   🎨 NOID Dashboard"
echo "      http://localhost:3000/dashboard"
echo ""
echo "   🏥 Health Checks Dashboard"
echo "      http://localhost:3003"
echo ""
echo "📝 LOGS:"
echo "   • Health Checks: /tmp/health-checks.log"
echo "   • NOID Dashboard: /tmp/noid-dashboard.log"
echo ""
echo "⏹️  Press Ctrl+C to stop all services"
echo "════════════════════════════════════════════════════════"
echo ""

# Keep script running and wait for processes
wait
