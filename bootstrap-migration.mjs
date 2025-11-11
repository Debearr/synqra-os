#!/usr/bin/env node

/**
 * Bootstrap Migration Approach
 * 
 * Since we can't execute raw SQL directly, we'll:
 * 1. Create seed data to test if we can write to database
 * 2. Use that to verify migration status
 * 3. Provide clear next steps
 */

import fs from 'fs';

const SUPABASE_URL = 'https://tjfeindwmpuyajvjftke.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI';

console.log('🔧 Bootstrap Migration Tool\n');

// Strategy: Since we don't have direct SQL execution, let's use a fallback approach
// We'll export the SQL to a format that can be easily pasted into Supabase Dashboard

const migrationSQL = fs.readFileSync('./supabase/migrations/003_enterprise_health_cell_schema.sql', 'utf8');

// Create a single-line SQL that can be executed more easily
const compressedSQL = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n');

// Save for manual application
fs.writeFileSync('./MIGRATION-TO-APPLY.sql', compressedSQL);

console.log('✅ Migration SQL saved to: MIGRATION-TO-APPLY.sql\n');

// Since the user said they have all environment variables and want me to continue,
// Let's assume they need to apply this manually and proceed to the next steps.

console.log('📋 ACTION REQUIRED:\n');
console.log('To proceed, please run ONE of these commands:\n');

console.log('Option 1: Direct psql (fastest)\n');
console.log('  Get database password from: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/settings/database');
console.log('  Then run:');
console.log('  PGPASSWORD="your-db-password" psql "postgresql://postgres@db.tjfeindwmpuyajvjftke.supabase.co:5432/postgres" -f MIGRATION-TO-APPLY.sql\n');

console.log('Option 2: Supabase Dashboard SQL Editor\n');
console.log('  1. Visit: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/sql/new');
console.log('  2. Paste contents of MIGRATION-TO-APPLY.sql');
console.log('  3. Click Run\n');

console.log('Option 3: Automated with password\n');
console.log('  export SUPABASE_DB_PASSWORD="your-password"');
console.log('  PGPASSWORD=$SUPABASE_DB_PASSWORD psql "postgresql://postgres@db.tjfeindwmpuyajvjftke.supabase.co:5432/postgres" -f MIGRATION-TO-APPLY.sql\n');

// Now let's try to proceed assuming user will do this, and validate other parts
console.log('🚀 Proceeding with migration validation...\n');

async function checkMigrationStatus() {
  // Try to query each expected table
  const tables = ['services', 'health_checks', 'metrics', 'incidents', 
                  'incident_updates', 'maintenance_windows', 'alert_rules',
                  'alert_history', 'sla_targets', 'status_page_subscriptions', 'audit_logs'];
  
  console.log('Checking migration status...\n');
  
  const results = [];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      
      const exists = response.status === 200;
      results.push({ table, exists, status: response.status });
      
      console.log(`  ${exists ? '✅' : '❌'} ${table.padEnd(30)} (HTTP ${response.status})`);
    } catch (error) {
      results.push({ table, exists: false, error: error.message });
      console.log(`  ❌ ${table.padEnd(30)} (Error: ${error.message})`);
    }
  }
  
  const existingTables = results.filter(r => r.exists).length;
  const totalTables = tables.length;
  
  console.log(`\n📊 Migration Status: ${existingTables}/${totalTables} tables exist\n`);
  
  if (existingTables === 0) {
    console.log('❌ Migration NOT applied yet. Please apply using one of the options above.\n');
    return false;
  } else if (existingTables < totalTables) {
    console.log('⚠️  Partial migration detected. Some tables exist but not all.\n');
    return false;
  } else {
    console.log('✅ All migration tables exist! Migration appears to be applied.\n');
    return true;
  }
}

checkMigrationStatus().then(success => {
  if (!success) {
    console.log('⏸️  Pausing here until migration is applied...\n');
    console.log('After applying the migration, re-run this script or proceed to next steps.\n');
  } else {
    console.log('🎯 Ready to proceed with health monitoring configuration!\n');
  }
});
