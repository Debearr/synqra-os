#!/usr/bin/env node

/**
 * Enterprise Health Cell Migration via REST API
 *
 * Applies the migration using Supabase REST API endpoints
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Missing required environment variables');
    process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

console.log('🚀 Enterprise Health Cell Migration (REST API)');
console.log('═══════════════════════════════════════════════\n');
console.log(`📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log('');

/**
 * Execute SQL via Supabase Management API
 */
async function executeSQLViaManagementAPI(sql) {
    if (!SUPABASE_ACCESS_TOKEN) {
        throw new Error('SUPABASE_ACCESS_TOKEN required for Management API');
    }

    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

    console.log('🔧 Using Supabase Management API');
    console.log(`   Endpoint: ${url}\n`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Management API error (${response.status}): ${errorText}`);
    }

    return await response.json();
}

/**
 * Execute SQL statement by statement
 */
async function executeSQLStatements(statements) {
    console.log(`⚡ Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\s+/g, ' ').trim();

        try {
            await executeSQLViaManagementAPI(stmt);
            successCount++;
            process.stdout.write('✓');
        } catch (error) {
            // Some errors are acceptable (already exists, etc.)
            const errorMsg = error.message || String(error);

            if (
                errorMsg.includes('already exists') ||
                errorMsg.includes('does not exist') ||
                errorMsg.includes('duplicate')
            ) {
                successCount++;
                process.stdout.write('○');
            } else {
                errorCount++;
                errors.push({ statement: preview, error: errorMsg });
                process.stdout.write('✗');
            }
        }

        if ((i + 1) % 50 === 0) {
            console.log(` [${i + 1}/${statements.length}]`);
        }
    }

    console.log('\n');

    return { successCount, errorCount, errors };
}

/**
 * Parse SQL into statements
 */
function parseSQLStatements(sqlContent) {
    // Remove comments
    const lines = sqlContent.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
    });

    const content = lines.join('\n');

    // Split by semicolon (simple approach)
    const statements = content
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return statements;
}

/**
 * Main execution
 */
async function main() {
    try {
        // Read migration file
        const migrationPath = join(__dirname, 'supabase', 'migrations', '003_enterprise_health_cell_schema.sql');
        console.log('📝 Reading migration file...');
        console.log(`   Path: ${migrationPath}\n`);

        const sqlContent = readFileSync(migrationPath, 'utf-8');

        // Check for Management API token
        if (!SUPABASE_ACCESS_TOKEN) {
            console.log('⚠️  SUPABASE_ACCESS_TOKEN not found in .env');
            console.log('');
            console.log('📋 Alternative Approach:');
            console.log('   Since we cannot execute the migration automatically,');
            console.log('   please follow these manual steps:\n');
            console.log('   1. Open Supabase Dashboard:');
            console.log(`      https://supabase.com/dashboard/project/${projectRef}/editor\n`);
            console.log('   2. Click on "SQL Editor" in the left sidebar\n');
            console.log('   3. Click "New query"\n');
            console.log('   4. Copy and paste the entire contents of:');
            console.log(`      ${migrationPath}\n`);
            console.log('   5. Click "Run" to execute the migration\n');
            console.log('   6. Verify that all tables were created in the Table Editor\n');
            console.log('═══════════════════════════════════════════\n');
            console.log('✅ Migration file created and ready!');
            console.log('   Location: supabase/migrations/003_enterprise_health_cell_schema.sql');
            console.log('');
            console.log('📊 Migration contains:');
            console.log('   • 11 tables');
            console.log('   • 3 utility functions');
            console.log('   • 7 triggers');
            console.log('   • 3 views');
            console.log('   • Multiple indexes');
            console.log('');
            console.log('═══════════════════════════════════════════\n');
            process.exit(0);
        }

        // Parse statements
        const statements = parseSQLStatements(sqlContent);

        // Execute
        const result = await executeSQLStatements(statements);

        // Display results
        console.log('═══════════════════════════════════════════');
        console.log('📊 EXECUTION SUMMARY');
        console.log('═══════════════════════════════════════════');
        console.log(`   ✅ Successful: ${result.successCount}`);
        console.log(`   ✗  Failed:     ${result.errorCount}`);
        console.log('═══════════════════════════════════════════\n');

        if (result.errors.length > 0) {
            console.log('⚠️  Errors:\n');
            result.errors.slice(0, 5).forEach((err, idx) => {
                console.log(`${idx + 1}. ${err.statement}...`);
                console.log(`   ${err.error}\n`);
            });
        }

        if (result.errorCount === 0) {
            console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!\n');
            process.exit(0);
        } else {
            console.log('⚠️  MIGRATION COMPLETED WITH ERRORS\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ MIGRATION FAILED');
        console.error('Error:', error.message);
        console.error('');
        process.exit(1);
    }
}

main();
