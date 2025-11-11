#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://tjfeindwmpuyajvjftke.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI';

console.log('🚀 Smart Migration Application Strategy...\n');

// Read migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/003_enterprise_health_cell_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Parse SQL into logical blocks
function parseSQL(sql) {
  // Remove comments and split by semicolons
  const lines = sql.split('\n');
  const blocks = [];
  let currentBlock = [];
  let inFunction = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip pure comment lines
    if (trimmed.startsWith('--') && !inFunction) {
      continue;
    }

    // Detect function definitions
    if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
      inFunction = true;
    }

    if (trimmed.includes('$$ LANGUAGE') || trimmed.includes('$$;')) {
      inFunction = false;
    }

    currentBlock.push(line);

    // End of statement
    if (trimmed.endsWith(';') && !inFunction) {
      const block = currentBlock.join('\n').trim();
      if (block && !block.match(/^--/)) {
        blocks.push(block);
      }
      currentBlock = [];
    }
  }

  return blocks;
}

async function executeRawSQL(sql) {
  // Use Supabase's database.query endpoint (requires project API key)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });

  return response;
}

async function applyMigration() {
  console.log('📊 Parsing migration SQL...\n');
  
  const blocks = parseSQL(migrationSQL);
  console.log(`✓ Found ${blocks.length} SQL statement blocks\n`);

  console.log('🔍 First 5 blocks:');
  blocks.slice(0, 5).forEach((block, i) => {
    const preview = block.substring(0, 80).replace(/\n/g, ' ');
    console.log(`  ${i + 1}. ${preview}${block.length > 80 ? '...' : ''}`);
  });

  console.log('\n💡 Since Supabase doesn\'t expose a direct SQL execution endpoint,');
  console.log('   we\'ll use psql with a connection string.\n');

  // Generate psql command
  console.log('📋 To apply the migration, run this command:\n');
  console.log('   Get your database password from Supabase Dashboard > Settings > Database');
  console.log('   Then run:\n');
  console.log(`   export PGPASSWORD='your-db-password'`);
  console.log(`   psql "postgresql://postgres.tjfeindwmpuyajvjftke:$PGPASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/003_enterprise_health_cell_schema.sql\n`);

  console.log('   Or direct connection:');
  console.log(`   psql "postgresql://postgres:$PGPASSWORD@db.tjfeindwmpuyajvjftke.supabase.co:5432/postgres" -f supabase/migrations/003_enterprise_health_cell_schema.sql\n`);

  // Try a workaround: Create tables using schema via REST API
  console.log('🔧 Attempting workaround: Creating tables individually...\n');

  // Check current tables
  const tablesCheck = await fetch(`${SUPABASE_URL}/rest/v1/services?limit=1`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });

  if (tablesCheck.status === 404) {
    console.log('❌ Tables do not exist yet. Migration needs to be applied.\n');
    console.log('🎯 Since automated SQL execution is restricted, I\'ll create a wrapper script...\n');
  } else {
    console.log('✅ Tables might already exist! Let\'s verify...\n');
    const text = await tablesCheck.text();
    console.log('Response:', text);
  }
}

applyMigration().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
