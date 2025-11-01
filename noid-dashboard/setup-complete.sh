#!/bin/bash

# ═══════════════════════════════════════════════════════════
# NØID DASHBOARD - COMPLETE AUTOMATIC SETUP
# Run this ONE command and everything is done
# ═══════════════════════════════════════════════════════════

set -e  # Exit on any error

echo ""
echo "🚀 NØID DASHBOARD - COMPLETE AUTOMATIC SETUP"
echo "═════════════════════════════════════════════"
echo ""

# ============================================================
# STEP 1: Check if in Next.js project
# ============================================================
echo "📍 STEP 1: Checking project..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in a Next.js project!"
    echo ""
    echo "DO THIS FIRST:"
    echo "─────────────────────────────────────"
    echo "npx create-next-app@latest noid-dashboard"
    echo "cd noid-dashboard"
    echo "bash setup-complete.sh"
    echo "─────────────────────────────────────"
    exit 1
fi
echo "✅ Found package.json"
echo ""

# ============================================================
# STEP 2: Create all directories
# ============================================================
echo "📁 STEP 2: Creating directory structure..."
mkdir -p components/dashboard
mkdir -p app/dashboard/content
mkdir -p app/dashboard/calendar
mkdir -p app/dashboard/analytics
mkdir -p app/dashboard/brand-voice
mkdir -p app/dashboard/integrations
mkdir -p app/dashboard/settings
echo "✅ All directories created"
echo ""

# ============================================================
# STEP 3: Install dependencies
# ============================================================
echo "📦 STEP 3: Installing lucide-react..."
npm install lucide-react --silent
echo "✅ lucide-react installed"
echo ""

# ============================================================
# STEP 4: Copy Tailwind config
# ============================================================
echo "⚙️  STEP 4: Configuring Tailwind..."
cp /mnt/user-data/outputs/tailwind.config.js tailwind.config.js
echo "✅ Tailwind configured with NØID colors"
echo ""

# ============================================================
# STEP 5: Copy all dashboard components
# ============================================================
echo "📝 STEP 5: Creating dashboard components..."
cp /mnt/user-data/outputs/DashboardLayout.jsx components/dashboard/
cp /mnt/user-data/outputs/OverviewPage.jsx components/dashboard/
cp /mnt/user-data/outputs/ContentPage.jsx components/dashboard/
cp /mnt/user-data/outputs/CalendarPage.jsx components/dashboard/
cp /mnt/user-data/outputs/AnalyticsPage.jsx components/dashboard/
cp /mnt/user-data/outputs/BrandVoicePage.jsx components/dashboard/
cp /mnt/user-data/outputs/IntegrationsPage.jsx components/dashboard/
cp /mnt/user-data/outputs/SettingsPage.jsx components/dashboard/
echo "✅ All 8 components created in components/dashboard/"
echo ""

# ============================================================
# STEP 6: Create route files
# ============================================================
echo "🛣️  STEP 6: Creating dashboard routes..."

# Overview page (main dashboard)
cat > app/dashboard/page.jsx << 'EOF'
import OverviewPage from '@/components/dashboard/OverviewPage'
export default OverviewPage
EOF

# Content page
cat > app/dashboard/content/page.jsx << 'EOF'
import ContentPage from '@/components/dashboard/ContentPage'
export default ContentPage
EOF

# Calendar page
cat > app/dashboard/calendar/page.jsx << 'EOF'
import CalendarPage from '@/components/dashboard/CalendarPage'
export default CalendarPage
EOF

# Analytics page
cat > app/dashboard/analytics/page.jsx << 'EOF'
import AnalyticsPage from '@/components/dashboard/AnalyticsPage'
export default AnalyticsPage
EOF

# Brand Voice page
cat > app/dashboard/brand-voice/page.jsx << 'EOF'
import BrandVoicePage from '@/components/dashboard/BrandVoicePage'
export default BrandVoicePage
EOF

# Integrations page
cat > app/dashboard/integrations/page.jsx << 'EOF'
import IntegrationsPage from '@/components/dashboard/IntegrationsPage'
export default IntegrationsPage
EOF

# Settings page
cat > app/dashboard/settings/page.jsx << 'EOF'
import SettingsPage from '@/components/dashboard/SettingsPage'
export default SettingsPage
EOF

echo "✅ All 7 routes created in app/dashboard/"
echo ""

# ============================================================
# STEP 7: Add fonts to layout
# ============================================================
echo "🔤 STEP 7: Adding Google Fonts..."
if [ -f "app/layout.js" ]; then
    if ! grep -q "Playfair Display" app/layout.js; then
        cp app/layout.js app/layout.js.backup
        
        # Find the <head> tag and add fonts after it
        if grep -q "<head>" app/layout.js; then
            sed -i '/<head>/a\        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700\&family=Playfair+Display:wght@700\&display=swap" rel="stylesheet" />' app/layout.js
            echo "✅ Google Fonts added to app/layout.js"
        else
            echo "⚠️  Couldn't auto-add fonts - add them manually to layout"
        fi
    else
        echo "✅ Fonts already added"
    fi
elif [ -f "app/layout.tsx" ]; then
    echo "⚠️  TypeScript detected - you may need to add fonts manually"
else
    echo "⚠️  No layout file found - you may need to add fonts manually"
fi
echo ""

# ============================================================
# COMPLETION MESSAGE
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎉 SETUP COMPLETE! DASHBOARD IS READY!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ WHAT WAS CREATED:"
echo "   • components/dashboard/ (8 component files)"
echo "   • app/dashboard/ (7 route pages)"
echo "   • tailwind.config.js (NØID brand colors)"
echo "   • All dependencies installed"
echo ""
echo "🚀 RUN YOUR DASHBOARD NOW:"
echo "─────────────────────────────────────────────────────────"
echo "   npm run dev"
echo ""
echo "   Then open: http://localhost:3000/dashboard"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "📄 AVAILABLE PAGES:"
echo "   • /dashboard              (Overview)"
echo "   • /dashboard/content      (Content Library)"
echo "   • /dashboard/calendar     (Scheduling)"
echo "   • /dashboard/analytics    (Performance)"
echo "   • /dashboard/brand-voice  (AI Training)"
echo "   • /dashboard/integrations (Connections)"
echo "   • /dashboard/settings     (Settings)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
