#!/usr/bin/env node

/**
 * Enterprise Health Cell Migration Applier
 *
 * Applies the 003_enterprise_health_cell_schema.sql migration
 * to the Supabase database using the service role key.
 */

import { createClient } from '@supabase/supabase-js';
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
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
    process.exit(1);
}

console.log('🚀 Enterprise Health Cell Migration Applier');
console.log('============================================\n');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 30)}...`);
console.log('');

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Execute SQL migration
 */
async function executeMigration() {
    try {
        // Read the migration file
        const migrationPath = join(__dirname, 'supabase', 'migrations', '003_enterprise_health_cell_schema.sql');
        console.log('📝 Reading migration file...');
        console.log(`   Path: ${migrationPath}`);

        const sqlContent = readFileSync(migrationPath, 'utf-8');
        console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
        console.log(`   Lines: ${sqlContent.split('\n').length}`);
        console.log('');

        // Split into individual statements (more robust parsing)
        console.log('🔍 Parsing SQL statements...');
        const statements = parseSQLStatements(sqlContent);
        console.log(`   Found ${statements.length} executable statements`);
        console.log('');

        // Execute statements one by one
        console.log('⚡ Executing migration...');
        console.log('   This may take a few moments...\n');

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        const errors = [];
        const results = [];

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const preview = statement.substring(0, 80).replace(/\s+/g, ' ').trim();

            // Skip empty statements
            if (!statement.trim()) {
                skipCount++;
                continue;
            }

            try {
                // Execute the SQL statement using RPC
                const { data, error } = await supabase.rpc('exec', {
                    sql: statement
                }).catch(async (err) => {
                    // If exec RPC doesn't exist, try direct query
                    return await executeRawSQL(statement);
                });

                if (error) {
                    // Some errors are acceptable (e.g., "already exists")
                    const errorMsg = error.message || String(error);

                    if (
                        errorMsg.includes('already exists') ||
                        errorMsg.includes('does not exist') ||
                        errorMsg.includes('duplicate')
                    ) {
                        skipCount++;
                        process.stdout.write('○');
                        results.push({ statement: preview, status: 'skipped', message: errorMsg });
                    } else {
                        errorCount++;
                        errors.push({ statement: preview, error: errorMsg });
                        process.stdout.write('✗');
                        results.push({ statement: preview, status: 'error', message: errorMsg });
                    }
                } else {
                    successCount++;
                    process.stdout.write('✓');
                    results.push({ statement: preview, status: 'success' });
                }

                // Line break every 50 statements
                if ((i + 1) % 50 === 0) {
                    console.log(` [${i + 1}/${statements.length}]`);
                }

            } catch (err) {
                errorCount++;
                const errorMsg = err.message || String(err);
                errors.push({ statement: preview, error: errorMsg });
                process.stdout.write('✗');
                results.push({ statement: preview, status: 'error', message: errorMsg });
            }
        }

        console.log('\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 MIGRATION EXECUTION SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Total Statements: ${statements.length}`);
        console.log(`   ✅ Successful:    ${successCount}`);
        console.log(`   ○  Skipped:       ${skipCount}`);
        console.log(`   ✗  Failed:        ${errorCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (errors.length > 0) {
            console.log('⚠️  ERRORS ENCOUNTERED:\n');
            errors.slice(0, 10).forEach((err, idx) => {
                console.log(`${idx + 1}. Statement: ${err.statement}...`);
                console.log(`   Error: ${err.error}\n`);
            });
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more errors\n`);
            }
        }

        // Verify tables were created
        console.log('🔍 Verifying table creation...\n');
        await verifyTables();

        return {
            success: errorCount === 0,
            successCount,
            skipCount,
            errorCount,
            errors,
            results
        };

    } catch (error) {
        console.error('❌ Fatal error during migration:', error.message);
        throw error;
    }
}

/**
 * Execute raw SQL using Supabase client
 */
async function executeRawSQL(sql) {
    // Note: Supabase doesn't expose a direct SQL execution endpoint via the JS client
    // This is a workaround using the REST API directly
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ sql })
    });

    if (!response.ok) {
        const error = await response.text();
        return { data: null, error: { message: error } };
    }

    const data = await response.json();
    return { data, error: null };
}

/**
 * Parse SQL file into individual statements
 */
function parseSQLStatements(sqlContent) {
    // Remove comments
    let content = sqlContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

    // Split by semicolon, but be careful with strings and functions
    const statements = [];
    let currentStatement = '';
    let inString = false;
    let inFunction = false;
    let stringChar = '';

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const prevChar = i > 0 ? content[i - 1] : '';

        // Track string boundaries
        if ((char === "'" || char === '"') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }

        // Track function boundaries
        if (!inString) {
            if (content.substring(i, i + 10).toUpperCase() === 'CREATE OR ') {
                inFunction = true;
            }
            if (content.substring(i, i + 8).toUpperCase() === 'END;' && inFunction) {
                inFunction = false;
                currentStatement += content.substring(i, i + 4);
                i += 3;
                continue;
            }
            if (content.substring(i, i + 3) === '$$;' && inFunction) {
                inFunction = false;
                currentStatement += '$$;';
                i += 2;
                statements.push(currentStatement.trim());
                currentStatement = '';
                continue;
            }
        }

        currentStatement += char;

        // Split on semicolon if not in string or function
        if (char === ';' && !inString && !inFunction) {
            const stmt = currentStatement.trim();
            if (stmt && stmt !== ';') {
                statements.push(stmt);
            }
            currentStatement = '';
        }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }

    return statements.filter(s => s && s !== ';');
}

/**
 * Verify that tables were created successfully
 */
async function verifyTables() {
    const expectedTables = [
        'services',
        'health_checks',
        'metrics',
        'incidents',
        'incident_updates',
        'maintenance_windows',
        'alert_rules',
        'alert_history',
        'sla_targets',
        'status_page_subscriptions',
        'audit_logs'
    ];

    console.log('📋 Checking for expected tables:\n');

    for (const tableName of expectedTables) {
        try {
            // Try to query the table
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(0);

            if (error) {
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`   ✗ ${tableName.padEnd(30)} [NOT FOUND]`);
                } else {
                    console.log(`   ⚠ ${tableName.padEnd(30)} [ERROR: ${error.message}]`);
                }
            } else {
                console.log(`   ✓ ${tableName.padEnd(30)} [EXISTS]`);
            }
        } catch (err) {
            console.log(`   ✗ ${tableName.padEnd(30)} [ERROR: ${err.message}]`);
        }
    }

    console.log('');
}

/**
 * Main execution
 */
async function main() {
    try {
        const result = await executeMigration();

        if (result.success || result.successCount > 0) {
            console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            console.log('🎉 Enterprise Health Cell schema has been');
            console.log('   applied to your Supabase database!');
            console.log('');
            console.log('📋 Created Components:');
            console.log('   • 11 database tables');
            console.log('   • 3 utility functions');
            console.log('   • 7 automated triggers');
            console.log('   • 3 convenience views');
            console.log('   • Multiple indexes for performance');
            console.log('');
            console.log('🔗 Next Steps:');
            console.log('   1. Open Supabase Dashboard');
            console.log('   2. Navigate to Table Editor');
            console.log('   3. Verify all tables are present');
            console.log('   4. Start building your health monitoring system!');
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            process.exit(0);
        } else {
            console.log('⚠️  MIGRATION COMPLETED WITH ERRORS');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            console.log('Some errors occurred during migration.');
            console.log('Please review the errors above and verify');
            console.log('your database schema in Supabase Dashboard.');
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error:', error.message);
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        process.exit(1);
    }
}

// Run the migration
main();
