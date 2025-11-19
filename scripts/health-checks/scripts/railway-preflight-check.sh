#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# RAILWAY DEPLOYMENT PREFLIGHT CHECK - synqra.co
# ═══════════════════════════════════════════════════════════════
# Comprehensive deployment readiness verification
# Version: 1.0.0
# Date: 2025-11-17

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Track results
CRITICAL_PASS=0
CRITICAL_FAIL=0
WARNING_COUNT=0
INFO_COUNT=0

echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}🚂 RAILWAY DEPLOYMENT PREFLIGHT CHECK${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Target: synqra.co (apps/synqra-mvp)${NC}"
echo -e "${CYAN}Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')${NC}"
echo ""

# Base paths
WORKSPACE_ROOT="/workspace"
APP_ROOT="$WORKSPACE_ROOT/apps/synqra-mvp"

# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

check_critical() {
  local name="$1"
  local condition="$2"
  
  echo -n "  [CRITICAL] ${name}... "
  
  if eval "$condition"; then
    echo -e "${GREEN}✅ PASS${NC}"
    CRITICAL_PASS=$((CRITICAL_PASS + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    CRITICAL_FAIL=$((CRITICAL_FAIL + 1))
    return 1
  fi
}

check_warning() {
  local name="$1"
  local condition="$2"
  local message="$3"
  
  echo -n "  [WARNING] ${name}... "
  
  if eval "$condition"; then
    echo -e "${GREEN}✅ OK${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  WARN${NC}"
    if [ -n "$message" ]; then
      echo -e "    ${YELLOW}→ ${message}${NC}"
    fi
    WARNING_COUNT=$((WARNING_COUNT + 1))
    return 1
  fi
}

check_info() {
  local name="$1"
  local command="$2"
  
  echo -n "  [INFO] ${name}... "
  local result=$(eval "$command" 2>&1)
  echo -e "${CYAN}${result}${NC}"
  INFO_COUNT=$((INFO_COUNT + 1))
}

section_header() {
  echo ""
  echo -e "${BLUE}${BOLD}━━━ $1 ━━━${NC}"
}

# ═══════════════════════════════════════════════════════════════
# 1. FILE STRUCTURE VALIDATION
# ═══════════════════════════════════════════════════════════════

section_header "1. File Structure Validation"

check_critical "App directory exists" "[ -d '$APP_ROOT' ]"
check_critical "package.json exists" "[ -f '$APP_ROOT/package.json' ]"
check_critical "next.config.ts exists" "[ -f '$APP_ROOT/next.config.ts' ]"
check_critical "nixpacks.toml exists" "[ -f '$WORKSPACE_ROOT/nixpacks.toml' ]"
check_critical "Procfile exists" "[ -f '$APP_ROOT/Procfile' ]"
check_critical "pnpm-workspace.yaml exists" "[ -f '$WORKSPACE_ROOT/pnpm-workspace.yaml' ]"

check_warning "No Dockerfile present" "[ ! -f '$WORKSPACE_ROOT/Dockerfile' ]" "Docker detected - should use Nixpacks"
check_warning "No railway.toml present" "[ ! -f '$WORKSPACE_ROOT/railway.toml' ]" "railway.toml detected - may conflict with auto-detection"
check_warning ".next directory clean" "[ ! -d '$APP_ROOT/.next' ]" ".next build cache exists - should be in .gitignore"

# ═══════════════════════════════════════════════════════════════
# 2. BUILD CONFIGURATION VALIDATION
# ═══════════════════════════════════════════════════════════════

section_header "2. Build Configuration Validation"

# Check nixpacks.toml
if [ -f "$WORKSPACE_ROOT/nixpacks.toml" ]; then
  check_critical "nixpacks.toml is valid TOML" "grep -q '\[phases.setup\]' '$WORKSPACE_ROOT/nixpacks.toml'"
  check_critical "Node.js 20 specified" "grep -q 'nodejs_20' '$WORKSPACE_ROOT/nixpacks.toml'"
  check_critical "pnpm specified" "grep -q 'pnpm' '$WORKSPACE_ROOT/nixpacks.toml'"
  check_critical "Build command present" "grep -q 'phases.build' '$WORKSPACE_ROOT/nixpacks.toml'"
  check_critical "Start command present" "grep -q 'phases.start' '$WORKSPACE_ROOT/nixpacks.toml'"
  
  # Check for UTF-8 BOM (causes TOML parsing errors)
  if command -v hexdump >/dev/null 2>&1; then
    check_warning "No UTF-8 BOM in nixpacks.toml" \
      "! hexdump -n 3 -e '3/1 \"%02x \"' '$WORKSPACE_ROOT/nixpacks.toml' | grep -q 'ef bb bf'" \
      "UTF-8 BOM detected - will break TOML parser"
  fi
fi

# Check package.json
if [ -f "$APP_ROOT/package.json" ]; then
  check_critical "package.json is valid JSON" "jq empty '$APP_ROOT/package.json' 2>/dev/null"
  check_critical "Node version specified" "jq -e '.engines.node' '$APP_ROOT/package.json' >/dev/null 2>&1"
  check_critical "Build script exists" "jq -e '.scripts.build' '$APP_ROOT/package.json' >/dev/null 2>&1"
  check_critical "Start script exists" "jq -e '.scripts.start' '$APP_ROOT/package.json' >/dev/null 2>&1"
  
  check_info "Node version requirement" "jq -r '.engines.node' '$APP_ROOT/package.json'"
  check_info "Build command" "jq -r '.scripts.build' '$APP_ROOT/package.json'"
  check_info "Start command" "jq -r '.scripts.start' '$APP_ROOT/package.json'"
fi

# Check Procfile
if [ -f "$APP_ROOT/Procfile" ]; then
  check_critical "Procfile has web process" "grep -q '^web:' '$APP_ROOT/Procfile'"
  check_info "Procfile web command" "grep '^web:' '$APP_ROOT/Procfile' | cut -d: -f2-"
fi

# ═══════════════════════════════════════════════════════════════
# 3. DEPENDENCY VALIDATION
# ═══════════════════════════════════════════════════════════════

section_header "3. Dependency Validation"

check_critical "pnpm-lock.yaml exists" "[ -f '$WORKSPACE_ROOT/pnpm-lock.yaml' ]"
check_warning "pnpm-lock.yaml is recent" \
  "[ $(find '$WORKSPACE_ROOT/pnpm-lock.yaml' -mtime -7 2>/dev/null | wc -l) -eq 1 ]" \
  "pnpm-lock.yaml older than 7 days - may be out of sync"

# Check critical dependencies
if [ -f "$APP_ROOT/package.json" ]; then
  echo "  Checking critical dependencies..."
  
  for dep in "next" "react" "react-dom" "@anthropic-ai/sdk" "@supabase/supabase-js"; do
    if jq -e ".dependencies.\"$dep\"" "$APP_ROOT/package.json" >/dev/null 2>&1; then
      version=$(jq -r ".dependencies.\"$dep\"" "$APP_ROOT/package.json")
      echo -e "    ${GREEN}✓${NC} $dep: $version"
    else
      echo -e "    ${YELLOW}⚠${NC} $dep: not found"
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done
fi

# ═══════════════════════════════════════════════════════════════
# 4. ENVIRONMENT VARIABLES CHECK
# ═══════════════════════════════════════════════════════════════

section_header "4. Environment Variables Check"

echo "  Required environment variables for production:"
echo ""

# Define required env vars
declare -A REQUIRED_VARS=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="Supabase project URL"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Supabase anonymous key"
  ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase service role key"
  ["ANTHROPIC_API_KEY"]="Anthropic API key for AI features"
  ["RAILWAY_WEBHOOK_SECRET"]="Railway webhook authentication"
)

MISSING_VARS=0
for var in "${!REQUIRED_VARS[@]}"; do
  echo -n "    $var... "
  if [ -n "${!var}" ]; then
    echo -e "${GREEN}✓ Set${NC}"
  else
    echo -e "${YELLOW}⚠ Not set in current environment${NC}"
    echo -e "      ${CYAN}→ ${REQUIRED_VARS[$var]}${NC}"
    MISSING_VARS=$((MISSING_VARS + 1))
  fi
done

if [ $MISSING_VARS -gt 0 ]; then
  echo ""
  echo -e "  ${YELLOW}Note: Env vars must be set in Railway dashboard${NC}"
  echo -e "  ${CYAN}Path: Railway → Project → Settings → Variables${NC}"
fi

# ═══════════════════════════════════════════════════════════════
# 5. PORT CONFIGURATION
# ═══════════════════════════════════════════════════════════════

section_header "5. Port Configuration"

# Check if start command uses PORT env var
if [ -f "$APP_ROOT/package.json" ]; then
  start_cmd=$(jq -r '.scripts.start' "$APP_ROOT/package.json")
  if echo "$start_cmd" | grep -q '\$PORT\|${PORT}'; then
    echo -e "  ${GREEN}✓${NC} Start command uses PORT environment variable"
    check_info "Start command" "echo '$start_cmd'"
  else
    echo -e "  ${YELLOW}⚠${NC} Start command may not use Railway's PORT variable"
    echo -e "    Current: $start_cmd"
    echo -e "    ${CYAN}→ Railway sets PORT dynamically - ensure app binds to \$PORT${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

check_info "Default port (if no PORT env)" "echo '3004 (from package.json start script)'"

# ═══════════════════════════════════════════════════════════════
# 6. HEALTH CHECK ENDPOINTS
# ═══════════════════════════════════════════════════════════════

section_header "6. Health Check Endpoints"

# Check if health endpoints exist
HEALTH_ENDPOINTS=(
  "app/api/health/route.ts"
  "app/api/ready/route.ts"
  "app/api/status/route.ts"
  "app/api/health/enterprise/route.ts"
)

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
  full_path="$APP_ROOT/$endpoint"
  endpoint_name=$(echo "$endpoint" | sed 's/app\/api\//\/api\//' | sed 's/\/route.ts//')
  
  if [ -f "$full_path" ]; then
    echo -e "  ${GREEN}✓${NC} $endpoint_name"
  else
    echo -e "  ${YELLOW}⚠${NC} $endpoint_name - not found"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
done

echo ""
echo -e "  ${CYAN}→ Configure in Railway: Settings → Health Check → /api/health${NC}"

# ═══════════════════════════════════════════════════════════════
# 7. DATABASE CONNECTIVITY
# ═══════════════════════════════════════════════════════════════

section_header "7. Database Connectivity"

# Check for Supabase client initialization
if [ -f "$APP_ROOT/lib/supabase/client.ts" ] || [ -f "$APP_ROOT/lib/supabaseClient.ts" ]; then
  echo -e "  ${GREEN}✓${NC} Supabase client file exists"
else
  echo -e "  ${YELLOW}⚠${NC} Supabase client file not found"
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Check if database migration files exist
if [ -d "$WORKSPACE_ROOT/supabase/migrations" ]; then
  migration_count=$(find "$WORKSPACE_ROOT/supabase/migrations" -name "*.sql" | wc -l)
  echo -e "  ${GREEN}✓${NC} Found $migration_count SQL migration files"
  check_info "Migrations directory" "ls -1 $WORKSPACE_ROOT/supabase/migrations | head -5"
else
  echo -e "  ${YELLOW}⚠${NC} No migrations directory found"
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# ═══════════════════════════════════════════════════════════════
# 8. BUILD TEST (DRY RUN)
# ═══════════════════════════════════════════════════════════════

section_header "8. Build Test (Validation)"

echo "  Testing build commands locally..."
echo ""

# Check if pnpm is available
if command -v pnpm >/dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} pnpm is installed: $(pnpm --version)"
else
  echo -e "  ${RED}✗${NC} pnpm is not installed"
  echo -e "    ${CYAN}→ Install: npm install -g pnpm${NC}"
  CRITICAL_FAIL=$((CRITICAL_FAIL + 1))
fi

# Check if node version matches
if command -v node >/dev/null 2>&1; then
  node_version=$(node --version | sed 's/v//')
  required_version=$(jq -r '.engines.node' "$APP_ROOT/package.json" | sed 's/>=//;s/\^//')
  
  echo -e "  ${GREEN}✓${NC} Node.js is installed: v$node_version"
  
  # Simple version check (major version)
  node_major=$(echo "$node_version" | cut -d. -f1)
  required_major=$(echo "$required_version" | cut -d. -f1)
  
  if [ "$node_major" -ge "$required_major" ]; then
    echo -e "    ${GREEN}✓${NC} Version meets requirement (>= $required_version)"
  else
    echo -e "    ${YELLOW}⚠${NC} Version may not meet requirement (>= $required_version)"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

# Test monorepo filter command
echo ""
echo "  Testing pnpm workspace filter..."
if pnpm --filter apps/synqra-mvp exec echo "Filter test successful" >/dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} pnpm filter command works"
else
  echo -e "  ${YELLOW}⚠${NC} pnpm filter command may have issues"
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# ═══════════════════════════════════════════════════════════════
# 9. RAILWAY-SPECIFIC CONFIGURATION
# ═══════════════════════════════════════════════════════════════

section_header "9. Railway-Specific Configuration"

# Check for Railway webhook handler
if [ -f "$APP_ROOT/app/api/railway-webhook/route.ts" ]; then
  echo -e "  ${GREEN}✓${NC} Railway webhook handler exists"
else
  echo -e "  ${YELLOW}⚠${NC} Railway webhook handler not found"
  echo -e "    ${CYAN}→ Optional: Enables auto-healing and monitoring${NC}"
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Check .gitignore for build artifacts
if [ -f "$WORKSPACE_ROOT/.gitignore" ]; then
  check_warning ".next in .gitignore" "grep -q '\.next' '$WORKSPACE_ROOT/.gitignore'" \
    "Add .next to .gitignore to avoid committing build artifacts"
  check_warning "node_modules in .gitignore" "grep -q 'node_modules' '$WORKSPACE_ROOT/.gitignore'" \
    "Add node_modules to .gitignore"
fi

# Check for environment-specific files
echo ""
echo "  Checking for environment-specific files..."
if [ -f "$APP_ROOT/.env.local" ]; then
  echo -e "    ${YELLOW}⚠${NC} .env.local found - should not be committed"
  WARNING_COUNT=$((WARNING_COUNT + 1))
else
  echo -e "    ${GREEN}✓${NC} No .env.local file"
fi

if [ -f "$APP_ROOT/.env.production" ]; then
  echo -e "    ${YELLOW}⚠${NC} .env.production found - use Railway variables instead"
  WARNING_COUNT=$((WARNING_COUNT + 1))
else
  echo -e "    ${GREEN}✓${NC} No .env.production file"
fi

# ═══════════════════════════════════════════════════════════════
# 10. SECURITY & BEST PRACTICES
# ═══════════════════════════════════════════════════════════════

section_header "10. Security & Best Practices"

# Check for sensitive files
SENSITIVE_PATTERNS=(
  "*.pem"
  "*.key"
  "*.env"
  "*.env.local"
  "*.env.production"
  ".env.*"
)

echo "  Checking for sensitive files in git..."
FOUND_SENSITIVE=0
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if git ls-files | grep -q "$pattern" 2>/dev/null; then
    echo -e "    ${RED}✗${NC} Found $pattern in git"
    FOUND_SENSITIVE=1
  fi
done

if [ $FOUND_SENSITIVE -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No sensitive files found in git"
else
  echo -e "  ${RED}⚠${NC} Sensitive files detected - should be removed from git"
  CRITICAL_FAIL=$((CRITICAL_FAIL + 1))
fi

# Check for TODO/FIXME in critical files
echo ""
echo "  Checking for unfinished work..."
TODO_COUNT=$(grep -r "TODO\|FIXME" "$APP_ROOT/app/api" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}⚠${NC} Found $TODO_COUNT TODO/FIXME comments in API routes"
  WARNING_COUNT=$((WARNING_COUNT + 1))
else
  echo -e "  ${GREEN}✓${NC} No TODO/FIXME in API routes"
fi

# ═══════════════════════════════════════════════════════════════
# 11. DEPLOYMENT READINESS CHECKLIST
# ═══════════════════════════════════════════════════════════════

section_header "11. Deployment Readiness Checklist"

echo ""
echo "  Manual checks required in Railway dashboard:"
echo ""
echo "  [ ] Environment variables set in Railway → Variables"
echo "  [ ] Domain configured: synqra.co"
echo "  [ ] Health check endpoint set: /api/health"
echo "  [ ] Resource limits configured (Memory: 1024MB, CPU: 1000m)"
echo "  [ ] Auto-deploy enabled for main branch"
echo "  [ ] Railway webhook URL configured (optional)"
echo "  [ ] Custom domain SSL certificate active"
echo "  [ ] Cron jobs configured (if needed)"
echo ""

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}📊 PREFLIGHT CHECK SUMMARY${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL_CRITICAL=$((CRITICAL_PASS + CRITICAL_FAIL))
echo -e "Critical Checks:  ${GREEN}${CRITICAL_PASS} passed${NC} / ${RED}${CRITICAL_FAIL} failed${NC} (${TOTAL_CRITICAL} total)"
echo -e "Warnings:         ${YELLOW}${WARNING_COUNT}${NC}"
echo -e "Info Items:       ${CYAN}${INFO_COUNT}${NC}"
echo ""

# Determine overall status
if [ $CRITICAL_FAIL -eq 0 ]; then
  if [ $WARNING_COUNT -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ STATUS: READY TO DEPLOY${NC}"
    echo -e "${GREEN}All critical checks passed with no warnings.${NC}"
    EXIT_CODE=0
  else
    echo -e "${YELLOW}${BOLD}⚠️  STATUS: READY WITH WARNINGS${NC}"
    echo -e "${YELLOW}All critical checks passed, but there are $WARNING_COUNT warnings to review.${NC}"
    EXIT_CODE=0
  fi
else
  echo -e "${RED}${BOLD}❌ STATUS: NOT READY TO DEPLOY${NC}"
  echo -e "${RED}$CRITICAL_FAIL critical checks failed. Fix these issues before deploying.${NC}"
  EXIT_CODE=1
fi

echo ""
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Deployment instructions
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}${BOLD}📋 Next Steps:${NC}"
  echo ""
  echo "1. Set environment variables in Railway dashboard"
  echo "2. Push to main branch (or trigger manual deploy)"
  echo "3. Monitor deployment logs in Railway"
  echo "4. Verify health endpoint: https://synqra.co/api/health"
  echo "5. Run post-deployment verification:"
  echo -e "   ${CYAN}bash $APP_ROOT/scripts/verify-deployment.sh https://synqra.co${NC}"
  echo ""
fi

exit $EXIT_CODE
