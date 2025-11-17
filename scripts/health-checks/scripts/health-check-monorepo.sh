#!/bin/bash
# ============================================================
# MONOREPO HEALTH CHECK SCRIPT
# ============================================================
# Comprehensive health and security check for NØID Labs monorepo
#
# Usage: bash scripts/health-check-monorepo.sh

set -e

echo "🏥 NØID Labs Monorepo Health Check"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Check workspace structure
echo "📁 Checking workspace structure..."
if [ -f "pnpm-workspace.yaml" ]; then
    pass "pnpm-workspace.yaml exists"
else
    fail "pnpm-workspace.yaml missing"
fi

if [ -f "turbo.json" ]; then
    pass "turbo.json exists"
else
    fail "turbo.json missing"
fi

if [ -d "apps" ] && [ -d "packages" ]; then
    pass "Monorepo structure (apps/ and packages/) exists"
else
    fail "Monorepo structure incomplete"
fi
echo ""

# 2. Check packages
echo "📦 Checking packages..."
PACKAGES=("database" "ai" "posting" "ui" "utils" "tsconfig" "eslint")
for pkg in "${PACKAGES[@]}"; do
    if [ -d "packages/$pkg" ]; then
        if [ -f "packages/$pkg/package.json" ]; then
            pass "Package @noid/$pkg configured"
        else
            fail "Package @noid/$pkg missing package.json"
        fi
    else
        fail "Package @noid/$pkg directory missing"
    fi
done
echo ""

# 3. Check apps
echo "🚀 Checking applications..."
APPS=("synqra" "noid-dashboard" "noid-cards")
for app in "${APPS[@]}"; do
    if [ -d "apps/$app" ]; then
        if [ -f "apps/$app/package.json" ]; then
            pass "App $app configured"
        else
            fail "App $app missing package.json"
        fi
    else
        fail "App $app directory missing"
    fi
done
echo ""

# 4. Check dependencies
echo "🔗 Checking dependencies..."
if [ -d "node_modules" ]; then
    pass "Root node_modules installed"
else
    warn "Root node_modules missing - run 'pnpm install'"
fi

if command -v pnpm &> /dev/null; then
    pass "pnpm installed"
else
    fail "pnpm not installed - install with: npm install -g pnpm"
fi

if command -v turbo &> /dev/null; then
    pass "turbo installed"
else
    warn "turbo not in PATH - may be in node_modules"
fi
echo ""

# 5. Check environment files
echo "🔐 Checking environment configuration..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    pass "Environment file exists"
else
    warn "No .env or .env.local found - may need configuration"
fi

for app in "${APPS[@]}"; do
    if [ -f "apps/$app/.env.local" ] || [ -f "apps/$app/.env" ]; then
        pass "App $app has environment config"
    else
        warn "App $app missing .env - may need configuration"
    fi
done
echo ""

# 6. Check security
echo "🔒 Security check..."

# Check for exposed secrets in code
if grep -r "sk-" apps/ packages/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | grep -q "sk-"; then
    fail "Potential API keys found in code! Review and remove."
else
    pass "No obvious API keys in code"
fi

# Check for hardcoded credentials
if grep -r "password.*=" apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "PASSWORD" | grep -q "password"; then
    warn "Potential hardcoded passwords found - review code"
else
    pass "No obvious hardcoded passwords"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore && grep -q "node_modules" .gitignore; then
        pass ".gitignore properly configured"
    else
        warn ".gitignore may be incomplete"
    fi
else
    fail ".gitignore missing!"
fi
echo ""

# 7. Check file integrity
echo "🗂️  Checking file integrity..."

# Check for broken symlinks
BROKEN_LINKS=$(find . -xtype l 2>/dev/null | wc -l)
if [ "$BROKEN_LINKS" -eq 0 ]; then
    pass "No broken symlinks"
else
    warn "Found $BROKEN_LINKS broken symlinks"
fi

# Check for large files (>50MB)
LARGE_FILES=$(find . -type f -size +50M 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l)
if [ "$LARGE_FILES" -eq 0 ]; then
    pass "No unusually large files"
else
    warn "Found $LARGE_FILES files >50MB - review if needed"
fi
echo ""

# 8. Check TypeScript configuration
echo "📘 Checking TypeScript configuration..."
for app in "${APPS[@]}"; do
    if [ -f "apps/$app/tsconfig.json" ]; then
        pass "App $app has tsconfig.json"
    else
        fail "App $app missing tsconfig.json"
    fi
done

for pkg in "database" "ai" "posting" "utils"; do
    if [ -f "packages/$pkg/tsconfig.json" ]; then
        pass "Package @noid/$pkg has tsconfig.json"
    else
        fail "Package @noid/$pkg missing tsconfig.json"
    fi
done
echo ""

# 9. Check for common issues
echo "🔍 Checking for common issues..."

# Check for duplicate dependencies
DUPE_CHECK=$(find . -name "package.json" -not -path "*/node_modules/*" -exec cat {} \; | grep -o '"[^"]*": "\^[0-9]' | sort | uniq -d | wc -l)
if [ "$DUPE_CHECK" -gt 5 ]; then
    warn "Multiple versions of some packages detected - consider consolidating"
else
    pass "Dependency versions look consistent"
fi

# Check for missing .gitkeep in empty dirs
EMPTY_DIRS=$(find . -type d -empty -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
if [ "$EMPTY_DIRS" -gt 0 ]; then
    info "Found $EMPTY_DIRS empty directories"
fi
echo ""

# 10. Workspace integrity
echo "🏗️  Checking workspace integrity..."
if pnpm list >/dev/null 2>&1; then
    pass "All workspace dependencies resolved"
else
    fail "Workspace dependencies have issues - run 'pnpm install'"
fi
echo ""

# Summary
echo "===================================="
echo "📊 Health Check Summary"
echo "===================================="
echo -e "${GREEN}✓ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARN${NC}"
echo -e "${RED}✗ Failed: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 Monorepo is healthy!${NC}"
    exit 0
elif [ "$FAIL" -lt 5 ]; then
    echo -e "${YELLOW}⚠️  Monorepo has minor issues - review and fix${NC}"
    exit 0
else
    echo -e "${RED}❌ Monorepo has critical issues - fix before deployment${NC}"
    exit 1
fi
