#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://tjfeindwmpuyajvjftke.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI';

console.log('🚀 Starting Enterprise Health Cell Migration...\n');

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/003_enterprise_health_cell_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split SQL into individual statements (basic approach)
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .map(s => s + ';');

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

// Execute statements sequentially via Supabase REST API
async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

// Since exec_sql doesn't exist, we'll use a different approach:
// Create tables directly via REST API or use pg library
// Let's install @supabase/supabase-js and use it

console.log('⚠️  Direct SQL execution via REST API is not available.');
console.log('📦 Using alternative approach: Creating helper function first...\n');

// Alternative: Use the SQL editor endpoint if available
// Or create tables one by one using the createClient approach

async function applyMigration() {
  try {
    // Test connection first
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });

    if (!testResponse.ok) {
      throw new Error(`Connection failed: ${testResponse.status}`);
    }

    console.log('✅ Connected to Supabase successfully\n');

    // Since we can't execute raw SQL, we'll need to:
    // 1. Install pg library
    // 2. Or use Supabase SQL Editor API
    // 3. Or execute via connection string

    console.log('🔧 To apply this migration, you have two options:\n');
    console.log('Option 1: Use Supabase Dashboard');
    console.log('  - Go to: https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/sql/new');
    console.log('  - Paste the contents of: supabase/migrations/003_enterprise_health_cell_schema.sql');
    console.log('  - Click "Run"\n');
    
    console.log('Option 2: Use PostgreSQL direct connection');
    console.log('  - Get your database password from Supabase Dashboard');
    console.log('  - Run: psql "postgresql://postgres:[password]@db.tjfeindwmpuyajvjftke.supabase.co:5432/postgres" -f supabase/migrations/003_enterprise_health_cell_schema.sql\n');

    console.log('⚠️  Attempting to apply via pg library...\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
