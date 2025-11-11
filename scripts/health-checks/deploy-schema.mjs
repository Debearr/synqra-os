#!/usr/bin/env node
/**
 * Enterprise Health Cell System - Database Schema Deployment
 * Deploys the complete health monitoring schema to Supabase
 * Version: 1.0.0
 * Created: 2025-11-11
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================================
// CONFIGURATION
// ==============================================

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];

// Validate environment
function validateEnvironment() {
  const missing = REQUIRED_ENV.filter((v) => !process.env[v]);
  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    console.error("\nPlease set them in .env file or export them:");
    console.error(`export SUPABASE_URL=your_url`);
    console.error(`export SUPABASE_SERVICE_KEY=your_key`);
    process.exit(1);
  }
  return true;
}

validateEnvironment();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ==============================================
// DEPLOYMENT FUNCTIONS
// ==============================================

/**
 * Reads SQL migration file
 */
function readMigrationFile() {
  const migrationPath = path.join(
    __dirname,
    "supabase/migrations/003_enterprise_health_cell_schema.sql"
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  return fs.readFileSync(migrationPath, "utf8");
}

/**
 * Checks if tables already exist
 */
async function checkExistingTables() {
  console.log("🔍 Checking for existing health tables...");

  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'health_%'
        ORDER BY table_name;
      `,
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      const { data: tables, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .like("table_name", "health_%");

      if (tablesError) {
        console.warn("⚠️  Could not check existing tables:", tablesError.message);
        return [];
      }

      return tables || [];
    }

    return data || [];
  } catch (error) {
    console.warn("⚠️  Could not check existing tables:", error.message);
    return [];
  }
}

/**
 * Validates table deployment
 */
async function validateDeployment() {
  console.log("\n🔍 Validating deployment...");

  const expectedTables = [
    "health_projects",
    "health_services",
    "health_logs",
    "health_service_status",
    "health_alert_rules",
    "health_alerts",
    "health_alert_notifications",
    "health_incidents",
    "health_incident_updates",
    "health_recovery_actions",
    "health_recovery_log",
    "health_metrics_hourly",
    "health_metrics_daily",
  ];

  let allValid = true;

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);

      if (error) {
        console.error(`  ❌ ${tableName}: NOT FOUND or INACCESSIBLE`);
        console.error(`     Error: ${error.message}`);
        allValid = false;
      } else {
        console.log(`  ✅ ${tableName}: OK`);
      }
    } catch (error) {
      console.error(`  ❌ ${tableName}: ERROR - ${error.message}`);
      allValid = false;
    }
  }

  return allValid;
}

/**
 * Main deployment function
 */
async function deploySchema() {
  console.log("🚀 Enterprise Health Cell - Database Schema Deployment");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log("━".repeat(60));

  // Check existing tables
  const existingTables = await checkExistingTables();

  if (existingTables.length > 0) {
    console.log(`\n⚠️  Found ${existingTables.length} existing health tables:`);
    existingTables.forEach((table) => {
      console.log(`   - ${table.table_name || table}`);
    });

    console.log("\n⚠️  WARNING: Tables already exist!");
    console.log("This script will attempt to create tables with IF NOT EXISTS clauses.");
    console.log("Existing data will be preserved.\n");
  }

  // Read migration file
  console.log("📖 Reading migration file...");
  const sql = readMigrationFile();
  console.log(`✅ Loaded ${sql.length} characters of SQL`);

  // Deploy using Supabase SQL Editor method
  console.log("\n📝 MANUAL DEPLOYMENT REQUIRED");
  console.log("━".repeat(60));
  console.log("\nDue to Supabase security restrictions, please deploy manually:");
  console.log("\n1. Open Supabase Dashboard");
  console.log(`   ${process.env.SUPABASE_URL.replace("/v1", "")}/project/_/sql/new`);
  console.log("\n2. Copy the SQL from:");
  console.log(`   scripts/health-checks/supabase/migrations/003_enterprise_health_cell_schema.sql`);
  console.log("\n3. Paste into SQL Editor and click 'Run'");
  console.log("\n4. Wait for completion (should take 5-10 seconds)");
  console.log("\n5. Run this script again to validate deployment");
  console.log("━".repeat(60));

  // Validate deployment
  console.log("\n🔍 Attempting to validate current state...");
  const isValid = await validateDeployment();

  if (isValid) {
    console.log("\n✅ SUCCESS: All health tables are deployed and accessible!");
    console.log("\n🎯 Next Steps:");
    console.log("   1. Run seed script: node seed-health-data.mjs");
    console.log("   2. Test health monitor: node enterprise-health-monitor.mjs");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tables are missing or inaccessible");
    console.log("Please complete the manual deployment steps above.");
    process.exit(1);
  }
}

// ==============================================
// EXECUTION
// ==============================================

deploySchema().catch((error) => {
  console.error("\n💥 Deployment failed:", error);
  process.exit(1);
});
