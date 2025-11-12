#!/bin/bash
##
# Apply PulseEngine Migration via Supabase REST API
# Uses direct SQL execution
##

SUPABASE_URL="${SUPABASE_URL:-https://tjfeindwmpuyajvjftke.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI}"

echo "🔄 Checking Supabase connection..."

# Test connection
response=$(curl -s -w "%{http_code}" -o /dev/null \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "$SUPABASE_URL/rest/v1/")

if [ "$response" != "200" ]; then
  echo "❌ Cannot connect to Supabase (HTTP $response)"
  echo "💡 Please apply migration manually:"
  echo "   1. Open: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor"
  echo "   2. Paste: supabase/migrations/20251112151500_pulseengine.sql"
  echo "   3. Run query"
  exit 1
fi

echo "✅ Supabase connection OK"
echo ""
echo "💡 MANUAL MIGRATION REQUIRED:"
echo "   The Supabase REST API doesn't support direct SQL execution for DDL."
echo "   Please apply the migration via Supabase Dashboard:"
echo ""
echo "   1. Open: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor"
echo "   2. Open file: supabase/migrations/20251112151500_pulseengine.sql"
echo "   3. Copy all contents"
echo "   4. Paste into SQL Editor"
echo "   5. Click 'RUN'"
echo ""
echo "   Tables to be created:"
echo "   - pulse_trends (trending topics cache)"
echo "   - pulse_campaigns (user campaigns)"
echo "   - pulse_tokens (rate limiting)"
echo "   - pulse_shares (viral tracking)"
echo "   - content_jobs (extended with source column)"
echo ""
echo "🔗 Quick link: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor"
