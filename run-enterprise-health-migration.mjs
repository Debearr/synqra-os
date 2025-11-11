#!/usr/bin/env node

/**
 * Enterprise Health Cell Migration Runner
 *
 * This script applies the enterprise_health_cell_schema migration
 * to the Supabase database using the service role key.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env');
    process.exit(1);
}

console.log('🚀 Enterprise Health Cell Migration Runner');
console.log('==========================================\n');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Using Service Role Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
console.log('');

/**
 * Execute SQL migration using Supabase REST API
 */
async function executeMigration(sqlContent) {
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

    try {
        console.log('📝 Reading migration file...');
        console.log(`   File: supabase/migrations/003_enterprise_health_cell_schema.sql`);
        console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
        console.log('');

        console.log('🔄 Executing migration via Supabase Management API...');

        // Use the Supabase Management API to execute SQL
        const managementUrl = `${SUPABASE_URL.replace('.supabase.co', '')}/rest/v1/rpc/exec`;

        // Try using pg admin connection
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: sqlContent })
        });

        if (!response.ok) {
            // If the RPC method doesn't exist, we'll use direct SQL execution
            console.log('⚠️  RPC method not available, using direct connection...');
            return await executeMigrationDirect(sqlContent);
        }

        const result = await response.json();
        console.log('✅ Migration executed successfully via REST API');
        return { success: true, result };

    } catch (error) {
        console.log('⚠️  REST API method failed, attempting direct connection...');
        return await executeMigrationDirect(sqlContent);
    }
}

/**
 * Execute migration using direct PostgreSQL connection
 */
async function executeMigrationDirect(sqlContent) {
    try {
        // Parse the Supabase URL to get connection details
        const url = new URL(SUPABASE_URL);
        const projectRef = url.hostname.split('.')[0];

        // Supabase connection string format
        const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || '[password]'}@db.${projectRef}.supabase.co:5432/postgres`;

        console.log('🔌 Attempting direct PostgreSQL connection...');
        console.log('   Note: This requires @supabase/supabase-js or node-postgres');
        console.log('');

        // For now, we'll use fetch to the SQL editor API endpoint
        const editorUrl = `${SUPABASE_URL}/rest/v1/`;

        // Split SQL into individual statements and execute them
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📊 Found ${statements.length} SQL statements to execute`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i] + ';';

            // Skip comments
            if (stmt.trim().startsWith('--')) continue;

            try {
                // Execute via REST API query endpoint
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    },
                    body: JSON.stringify({ query: stmt })
                });

                if (response.ok) {
                    successCount++;
                    process.stdout.write(`✓`);
                } else {
                    errorCount++;
                    const error = await response.text();
                    errors.push({ statement: stmt.substring(0, 100), error });
                    process.stdout.write(`✗`);
                }

                if ((i + 1) % 50 === 0) {
                    console.log(` [${i + 1}/${statements.length}]`);
                }

            } catch (error) {
                errorCount++;
                errors.push({ statement: stmt.substring(0, 100), error: error.message });
                process.stdout.write(`✗`);
            }
        }

        console.log('\n');
        console.log('📈 Execution Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            errors.slice(0, 5).forEach((err, idx) => {
                console.log(`\n${idx + 1}. ${err.statement}...`);
                console.log(`   Error: ${err.error}`);
            });
            if (errors.length > 5) {
                console.log(`\n   ... and ${errors.length - 5} more errors`);
            }
        }

        return {
            success: errorCount === 0,
            successCount,
            errorCount,
            errors
        };

    } catch (error) {
        console.error('❌ Error executing migration directly:', error.message);
        throw error;
    }
}

/**
 * Execute migration using curl (fallback method)
 */
async function executeMigrationViaCurl(sqlContent) {
    const { execSync } = await import('child_process');

    try {
        console.log('🌐 Executing migration using curl...');

        // Save SQL to temporary file
        const tempFile = '/tmp/migration.sql';
        writeFileSync(tempFile, sqlContent);

        // Execute using psql via Supabase connection
        const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

        // Note: This requires SUPABASE_DB_PASSWORD in .env
        const dbPassword = process.env.SUPABASE_DB_PASSWORD;

        if (!dbPassword) {
            console.error('❌ SUPABASE_DB_PASSWORD not found in .env');
            console.error('   Cannot execute migration via direct connection');
            return { success: false, error: 'Missing DB password' };
        }

        const command = `PGPASSWORD="${dbPassword}" psql -h db.${projectRef}.supabase.co -U postgres -d postgres -f ${tempFile}`;

        const output = execSync(command, { encoding: 'utf-8' });

        console.log('✅ Migration executed successfully via psql');
        console.log(output);

        return { success: true, output };

    } catch (error) {
        console.error('❌ Error executing migration via curl:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        // Read the migration file
        const migrationPath = join(__dirname, 'supabase', 'migrations', '003_enterprise_health_cell_schema.sql');
        const sqlContent = readFileSync(migrationPath, 'utf-8');

        // Execute the migration
        const result = await executeMigration(sqlContent);

        if (result.success) {
            console.log('\n✅ SUCCESS!');
            console.log('==========================================');
            console.log('Enterprise Health Cell schema has been');
            console.log('successfully applied to your Supabase database.');
            console.log('==========================================\n');
            console.log('📋 Next Steps:');
            console.log('   1. Verify tables in Supabase Dashboard');
            console.log('   2. Test the health monitoring endpoints');
            console.log('   3. Configure alert rules');
            console.log('');
            process.exit(0);
        } else {
            console.log('\n⚠️  MIGRATION COMPLETED WITH WARNINGS');
            console.log('==========================================');
            console.log('Some statements may have failed.');
            console.log('Please check the errors above and verify');
            console.log('your database schema in Supabase Dashboard.');
            console.log('==========================================\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED');
        console.error('==========================================');
        console.error('Error:', error.message);
        console.error('==========================================\n');
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the migration
main();
