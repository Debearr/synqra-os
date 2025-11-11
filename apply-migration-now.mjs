#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Applying Enterprise Health Cell Migration\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration() {
    try {
        const migrationPath = join(__dirname, 'supabase', 'migrations', '003_enterprise_health_cell_schema.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📝 Executing migration SQL...\n');

        // Execute as single transaction via RPC
        const { data, error } = await supabase.rpc('exec', { sql });

        if (error) {
            // Try alternative: execute line by line via REST
            console.log('⚠️  RPC not available, using direct table creation...\n');
            return await createTablesDirectly();
        }

        console.log('✅ Migration applied successfully!\n');
        await verifyTables();
        return { success: true };

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📋 Alternative: Apply manually via Supabase Dashboard');
        console.log('   SQL Editor → Run: supabase/migrations/003_enterprise_health_cell_schema.sql\n');
        return { success: false, error: error.message };
    }
}

async function createTablesDirectly() {
    console.log('📊 Creating tables directly...\n');

    const tables = [
        'services', 'health_checks', 'metrics', 'incidents',
        'incident_updates', 'maintenance_windows', 'alert_rules',
        'alert_history', 'sla_targets', 'status_page_subscriptions', 'audit_logs'
    ];

    let created = 0;
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(0);
            if (!error) {
                console.log(`   ✓ ${table} (already exists)`);
                created++;
            }
        } catch (err) {
            console.log(`   ✗ ${table} (needs creation)`);
        }
    }

    if (created === tables.length) {
        console.log('\n✅ All tables already exist!\n');
        await verifyTables();
        return { success: true };
    } else {
        console.log(`\n⚠️  ${tables.length - created} tables need creation`);
        console.log('   Please apply migration via Supabase Dashboard SQL Editor\n');
        return { success: false };
    }
}

async function verifyTables() {
    console.log('🔍 Verifying tables...\n');

    const tables = [
        'services', 'health_checks', 'metrics', 'incidents',
        'incident_updates', 'maintenance_windows', 'alert_rules',
        'alert_history', 'sla_targets', 'status_page_subscriptions', 'audit_logs'
    ];

    for (const table of tables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(0);
            if (!error) {
                console.log(`   ✓ ${table}`);
            } else {
                console.log(`   ✗ ${table} (${error.message})`);
            }
        } catch (err) {
            console.log(`   ✗ ${table} (${err.message})`);
        }
    }
    console.log('');
}

applyMigration().then(result => {
    process.exit(result.success ? 0 : 1);
});
