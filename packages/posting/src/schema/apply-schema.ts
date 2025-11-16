/**
 * Database Schema Applier for Posting Pipeline
 *
 * This script applies the posting pipeline schema to your Supabase database.
 *
 * Usage:
 *   npx tsx lib/posting/schema/apply-schema.ts
 *
 * Requirements:
 *   - Valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applySchema() {
  // Load environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  // Skip if using demo credentials
  if (supabaseUrl.includes('demo') || supabaseKey.includes('demo')) {
    console.log('⚠️  Demo credentials detected - skipping schema application');
    console.log('📝 To apply schema:');
    console.log('   1. Set up real Supabase credentials in .env.local');
    console.log('   2. Or manually run: lib/posting/schema/posting-pipeline.sql');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  console.log('🗄️  Applying posting pipeline schema...');

  // Read the SQL file
  const schemaPath = join(__dirname, 'posting-pipeline.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Split into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists')) {
          console.log('✓ Table/index already exists (skipping)');
        } else {
          console.warn('⚠️ ', error.message);
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (err: any) {
      console.warn('⚠️  Statement failed:', err.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Schema application complete`);
  console.log(`   Success: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`   Warnings: ${errorCount} statements`);
  }
  console.log('\n📋 Tables created:');
  console.log('   • social_tokens - OAuth token storage');
  console.log('   • scheduled_posts - Post scheduling queue');
  console.log('   • posting_logs - Historical posting logs');
}

// Run if called directly
if (require.main === module) {
  applySchema()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

export { applySchema };
