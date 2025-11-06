#!/usr/bin/env node
/**
 * Enterprise Health Cell System - Installation Script
 * Sets up the health monitoring system and initializes database
 * Version: 1.0.0
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Enterprise Health Cell System - Installation");
console.log("━".repeat(60));

// Check environment variables
const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
const missing = requiredEnv.filter((v) => !process.env[v]);

if (missing.length) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((v) => console.error(`   - ${v}`));
  console.log("\n💡 Set these in your .env file or environment");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Create log directory
const logDir = path.join(__dirname, ".healthcell");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log("✅ Created .healthcell directory");
}

// Verify database connection
console.log("\n🔍 Verifying database connection...");

try {
  const { data, error } = await supabase.from("health_projects").select("count");

  if (error) {
    if (error.message.includes("does not exist")) {
      console.log("⚠️  Health monitoring tables not found");
      console.log("\n📝 Run the database migrations:");
      console.log("   1. supabase/migrations/003_enterprise_health_cell_schema.sql");
      console.log("\n   You can run them via Supabase Dashboard or psql:");
      console.log("   psql -f supabase/migrations/003_enterprise_health_cell_schema.sql");
      process.exit(1);
    } else {
      throw error;
    }
  }

  console.log("✅ Database connection verified");
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  process.exit(1);
}

// Check for existing projects
console.log("\n🔍 Checking for configured projects...");

const { data: projects, error: projectsError } = await supabase
  .from("health_projects")
  .select("*");

if (projectsError) {
  console.error("❌ Failed to fetch projects:", projectsError.message);
  process.exit(1);
}

if (projects && projects.length > 0) {
  console.log(`✅ Found ${projects.length} configured project(s):`);
  projects.forEach((p) => {
    console.log(`   - ${p.display_name} (${p.project_key})`);
  });
} else {
  console.log("⚠️  No projects configured yet");
  console.log("   Projects will be initialized by the migration script");
}

// Check for configured services
console.log("\n🔍 Checking for configured services...");

const { data: services, error: servicesError } = await supabase
  .from("health_services")
  .select("display_name, service_key, is_active");

if (servicesError) {
  console.error("❌ Failed to fetch services:", servicesError.message);
  process.exit(1);
}

if (services && services.length > 0) {
  console.log(`✅ Found ${services.length} configured service(s):`);
  services.forEach((s) => {
    console.log(`   - ${s.display_name} (${s.service_key}) ${s.is_active ? "✓" : "✗"}`);
  });
} else {
  console.log("⚠️  No services configured yet");
  console.log("   Services will be initialized by the migration script");
}

// Write installation log
const installLog = {
  installed_at: new Date().toISOString(),
  version: "1.0.0-enterprise",
  components: [
    "enterprise-health-monitor.mjs",
    "recovery-automation.mjs",
    "enterprise-health-cell.yml",
    "dashboard (Next.js)",
    "database schema",
  ],
  projects_count: projects?.length || 0,
  services_count: services?.length || 0,
};

fs.writeFileSync(
  path.join(logDir, "install.log"),
  JSON.stringify(installLog, null, 2)
);

console.log("\n━".repeat(60));
console.log("✅ Installation complete!");
console.log("\n📚 Next steps:");
console.log("   1. Run health check:   npm run health:check");
console.log("   2. Start recovery:     npm run health:recovery");
console.log("   3. Start dashboard:    npm run dev");
console.log("\n📊 Dashboard will be available at:");
console.log("   http://localhost:3003");
console.log("\n📖 See README.md for full documentation");
console.log("━".repeat(60));
