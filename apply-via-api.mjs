#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

console.log('🚀 Applying Migration via Supabase Management API\n');
console.log(`📍 Project: ${projectRef}\n`);

async function applyMigration() {
    try {
        const migrationPath = join(__dirname, 'supabase', 'migrations', '003_enterprise_health_cell_schema.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📝 Sending SQL to Supabase Management API...\n');

        const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

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
            console.error('❌ API Error:', response.status, response.statusText);
            console.error('   Details:', errorText);
            console.log('\n📋 Manual Application Required:');
            console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/editor`);
            console.log('   2. Click SQL Editor → New Query');
            console.log('   3. Paste contents of: supabase/migrations/003_enterprise_health_cell_schema.sql');
            console.log('   4. Click Run\n');
            return { success: false };
        }

        const result = await response.json();
        console.log('✅ Migration applied successfully!\n');
        console.log('📊 Result:', result);
        console.log('');

        return { success: true };

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📋 Please apply manually via Supabase Dashboard\n');
        return { success: false };
    }
}

applyMigration().then(result => {
    if (result.success) {
        console.log('✅ MIGRATION COMPLETE!');
        console.log('   All Enterprise Health Cell tables are now live.\n');
    }
    process.exit(result.success ? 0 : 1);
});
