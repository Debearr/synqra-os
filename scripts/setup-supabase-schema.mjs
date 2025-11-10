#!/usr/bin/env node
/**
 * Supabase Schema Migration Script
 * Applies posting pipeline schema to Supabase
 * Generated: 2025-11-10
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tjfeindwmpuyayjvftke.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applySchema() {
  console.log('🗄️  Synqra OS - Supabase Schema Migration');
  console.log('=========================================');
  console.log('');
  console.log(`📍 Target: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Read the SQL schema file
    const schemaPath = join(__dirname, '../apps/synqra-mvp/lib/posting/schema/posting-pipeline.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('📄 Applying posting pipeline schema...');
    
    // Execute the schema (note: Supabase client doesn't support raw SQL execution)
    // You'll need to run this in Supabase SQL Editor or use Supabase CLI
    console.log('');
    console.log('⚠️  MANUAL ACTION REQUIRED:');
    console.log('Copy the following SQL and run it in your Supabase SQL Editor:');
    console.log('👉 https://supabase.com/dashboard/project/tjfeindwmpuyayjvftke/sql');
    console.log('');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(schema);
    console.log('─────────────────────────────────────────────────────────────');
    console.log('');
    console.log('✅ Once applied, the following tables will be created:');
    console.log('   • social_tokens - OAuth tokens for platforms');
    console.log('   • scheduled_posts - Queue of scheduled posts');
    console.log('   • posting_logs - Historical log of posting attempts');
    console.log('');

    // Verify existing tables
    console.log('🔍 Checking existing tables...');
    const { data: tables, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      console.log('⚠️  Could not verify tables (this is normal)');
    } else {
      console.log('📋 Existing tables:');
      tables.forEach(t => console.log(`   • ${t.tablename}`));
    }

    console.log('');
    console.log('✅ Schema migration instructions provided!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applySchema();
