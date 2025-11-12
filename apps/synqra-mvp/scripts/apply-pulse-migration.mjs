#!/usr/bin/env node
/**
 * Apply PulseEngine Migration to Production Supabase
 * Run from apps/synqra-mvp directory where @supabase/supabase-js is installed
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Session credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tjfeindwmpuyajvjftke.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI';

async function applyMigration() {
  console.log('🔄 Reading PulseEngine migration...');
  const migrationPath = join(__dirname, '../../../supabase/migrations/20251112151500_pulseengine.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📊 Migration file size:', migrationSQL.length, 'chars');
  console.log('🔄 Applying to:', SUPABASE_URL);

  try {
    // Use Supabase Management API for executing SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ Migration applied successfully!');
    console.log('📊 Tables created:');
    console.log('   - pulse_trends');
    console.log('   - pulse_campaigns');
    console.log('   - pulse_tokens');
    console.log('   - pulse_shares');
    console.log('🔧 Extended: content_jobs (source, metadata)');

  } catch (error) {
    console.error('❌ Automated application failed:', error.message);
    console.log('\n💡 MANUAL MIGRATION REQUIRED:');
    console.log('   1. Open: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor');
    console.log('   2. Copy contents from: supabase/migrations/20251112151500_pulseengine.sql');
    console.log('   3. Paste into SQL Editor and RUN');
    console.log('\n🔗 Direct link: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor');
    process.exit(1);
  }
}

applyMigration().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
