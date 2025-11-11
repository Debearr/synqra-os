#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

// Supabase connection details
const SUPABASE_PROJECT_REF = 'tjfeindwmpuyajvjftke';
const SUPABASE_URL = 'https://tjfeindwmpuyajvjftke.supabase.co';

// For Supabase, we can use the connection pooler
// Connection string format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// Or direct: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

// Since we have service role key, let's try using SQL via HTTP
console.log('🚀 Applying Enterprise Health Cell Migration via Direct Connection...\n');

// Read migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/003_enterprise_health_cell_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyViaHTTP() {
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI';
  
  console.log('📝 Attempting to create tables via REST API...\n');
  
  // Try to create first table to test
  const createServicesSQL = `
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      service_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'operational',
      url TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT services_name_unique UNIQUE(name),
      CONSTRAINT services_status_check CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance'))
    );
  `;

  // Since REST API doesn't support raw SQL, we need to use the Database API
  // Let's check if we can use the pg_net extension or create a SQL function

  console.log('⚠️  REST API does not support raw SQL execution.');
  console.log('💡 Alternative: Using Supabase SQL Editor via Management API...\n');

  // Try Management API approach
  const managementResponse = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: createServicesSQL
    })
  });

  console.log('Management API response status:', managementResponse.status);
  const responseText = await managementResponse.text();
  console.log('Management API response:', responseText);

  if (!managementResponse.ok) {
    throw new Error(`Management API failed: ${responseText}`);
  }
}

// Try via HTTP first, then fallback to instructions
applyViaHTTP().catch(error => {
  console.error('❌ HTTP approach failed:', error.message);
  console.log('\n📋 Manual Migration Required:\n');
  console.log('Please run the migration manually using one of these methods:\n');
  console.log('1. Supabase Dashboard SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new\n`);
  console.log('2. Or provide database password to use psql command\n');
  process.exit(1);
});
