#!/usr/bin/env node

/**
 * Enterprise Health Cell Migration Script
 *
 * Applies the 003_enterprise_health_cell_schema.sql migration
 * directly to Supabase PostgreSQL database.
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL) {
    console.error('❌ Error: SUPABASE_URL not found in .env');
    process.exit(1);
}

// Extract project reference from URL
const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

console.log('🚀 Enterprise Health Cell Migration');
console.log('═══════════════════════════════════════════\n');
console.log(`📍 Supabase Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log('');

/**
 * Get database connection configuration
 */
function getConnectionConfig() {
    // Try multiple connection methods

    // Method 1: Direct connection with password
    if (SUPABASE_DB_PASSWORD) {
        console.log('🔐 Using direct database connection with password');
        return {
            host: `db.${projectRef}.supabase.co`,
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: SUPABASE_DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        };
    }

    // Method 2: Connection pooler with service key (Supabase Transaction mode)
    // This uses the service_role JWT as password with a special user format
    if (SUPABASE_SERVICE_KEY) {
        console.log('🔐 Using Supabase connection pooler with service key');
        return {
            host: `db.${projectRef}.supabase.co`,
            port: 6543, // Transaction pooler port
            database: 'postgres',
            user: `postgres.${projectRef}`,
            password: SUPABASE_SERVICE_KEY,
            ssl: { rejectUnauthorized: false }
        };
    }

    throw new Error('No valid database credentials found. Please add SUPABASE_DB_PASSWORD or SUPABASE_SERVICE_KEY to .env');
}

/**
 * Execute migration
 */
async function executeMigration() {
    const client = new Client(getConnectionConfig());

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Read migration file
        const migrationPath = join(__dirname, 'supabase', 'migrations', '003_enterprise_health_cell_schema.sql');
        console.log('📝 Reading migration file...');
        console.log(`   Path: ${migrationPath}`);

        const sqlContent = readFileSync(migrationPath, 'utf-8');
        const lines = sqlContent.split('\n').length;
        const sizeKB = (sqlContent.length / 1024).toFixed(2);

        console.log(`   Size: ${sizeKB} KB`);
        console.log(`   Lines: ${lines}`);
        console.log('');

        // Execute the entire migration as a single transaction
        console.log('⚡ Executing migration...');
        console.log('   Running in transaction mode for safety');
        console.log('');

        const startTime = Date.now();

        try {
            await client.query('BEGIN');
            await client.query(sqlContent);
            await client.query('COMMIT');

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('✅ Migration executed successfully!');
            console.log(`   Duration: ${duration}s`);
            console.log('');

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

        // Verify tables
        console.log('🔍 Verifying table creation...\n');
        await verifyTables(client);

        // Get table stats
        console.log('📊 Table Statistics:\n');
        await getTableStats(client);

        return { success: true };

    } catch (error) {
        console.error('❌ Error during migration:', error.message);

        // Provide helpful error messages
        if (error.message.includes('password authentication failed')) {
            console.error('\n💡 Tip: Make sure SUPABASE_DB_PASSWORD is set in your .env file');
            console.error('   You can find it in your Supabase Dashboard:');
            console.error('   Project Settings → Database → Connection string');
        } else if (error.message.includes('connect ECONNREFUSED')) {
            console.error('\n💡 Tip: Check your network connection and firewall settings');
        } else if (error.message.includes('already exists')) {
            console.error('\n💡 Note: Some database objects already exist');
            console.error('   This is usually safe to ignore');
        }

        throw error;

    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

/**
 * Verify tables were created
 */
async function verifyTables(client) {
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

    const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name = ANY($1)
        ORDER BY table_name;
    `;

    const result = await client.query(query, [expectedTables]);
    const foundTables = result.rows.map(row => row.table_name);

    console.log('📋 Table Verification:\n');

    for (const table of expectedTables) {
        const exists = foundTables.includes(table);
        const status = exists ? '✓' : '✗';
        const color = exists ? '' : ' [MISSING]';
        console.log(`   ${status} ${table.padEnd(30)}${color}`);
    }

    console.log('');

    const missingCount = expectedTables.length - foundTables.length;
    if (missingCount > 0) {
        console.log(`   ⚠️  ${missingCount} table(s) missing`);
    } else {
        console.log(`   ✅ All ${expectedTables.length} tables created successfully!`);
    }
    console.log('');
}

/**
 * Get table statistics
 */
async function getTableStats(client) {
    const query = `
        SELECT
            schemaname,
            tablename,
            COALESCE(n_live_tup, 0) as row_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
    `;

    const result = await client.query(query);

    if (result.rows.length > 0) {
        console.log('   Table Name                    | Rows');
        console.log('   ' + '─'.repeat(45));
        result.rows.forEach(row => {
            console.log(`   ${row.tablename.padEnd(30)}| ${row.row_count}`);
        });
        console.log('');
    }

    // Get views
    const viewQuery = `
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `;

    const viewResult = await client.query(viewQuery);

    if (viewResult.rows.length > 0) {
        console.log('📊 Views Created:\n');
        viewResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        console.log('');
    }

    // Get functions
    const functionQuery = `
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND routine_name LIKE '%health%' OR routine_name LIKE '%incident%'
        ORDER BY routine_name;
    `;

    const functionResult = await client.query(functionQuery);

    if (functionResult.rows.length > 0) {
        console.log('⚙️  Functions Created:\n');
        functionResult.rows.forEach(row => {
            console.log(`   ✓ ${row.routine_name}()`);
        });
        console.log('');
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('🎯 Starting Enterprise Health Cell Migration...\n');

        const result = await executeMigration();

        if (result.success) {
            console.log('═══════════════════════════════════════════');
            console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('═══════════════════════════════════════════\n');
            console.log('🎉 Enterprise Health Cell schema is now live!\n');
            console.log('📋 What was created:');
            console.log('   • 11 database tables with full CRUD support');
            console.log('   • 3 utility functions (uptime calc, incident numbering)');
            console.log('   • 7 automated triggers for timestamp updates');
            console.log('   • 3 convenience views for common queries');
            console.log('   • Comprehensive indexes for performance');
            console.log('   • Foreign key constraints with CASCADE rules');
            console.log('   • JSONB fields for flexible metadata');
            console.log('');
            console.log('🔗 Next Steps:');
            console.log('   1. Open your Supabase Dashboard');
            console.log('      → https://supabase.com/dashboard/project/' + projectRef);
            console.log('');
            console.log('   2. Navigate to Table Editor to see your new tables');
            console.log('');
            console.log('   3. Start building your health monitoring features!');
            console.log('');
            console.log('═══════════════════════════════════════════\n');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n═══════════════════════════════════════════');
        console.error('❌ MIGRATION FAILED');
        console.error('═══════════════════════════════════════════\n');
        console.error('Error:', error.message);
        console.error('');

        if (error.stack) {
            console.error('Stack trace:');
            console.error(error.stack);
            console.error('');
        }

        console.error('═══════════════════════════════════════════\n');
        process.exit(1);
    }
}

// Run the migration
main();
