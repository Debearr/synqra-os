#!/usr/bin/env node
/**
 * Enterprise Health Cell System - Seed Data Script
 * Initializes projects, services, and sample alert rules
 * Version: 1.0.0
 * Created: 2025-11-11
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ==============================================
// CONFIGURATION
// ==============================================

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];

function validateEnvironment() {
  const missing = REQUIRED_ENV.filter((v) => !process.env[v]);
  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  return true;
}

validateEnvironment();

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
// SEED DATA DEFINITIONS
// ==============================================

const PROJECTS = [
  {
    project_key: "synqra_os",
    display_name: "SYNQRA OS",
    description: "Content Operating System - Multi-agent content generation platform",
    supabase_url: process.env.SUPABASE_URL,
    owner_email: "engineering@synqra.com",
    notification_emails: ["engineering@synqra.com", "ops@synqra.com"],
    is_active: true,
    config: {
      priority: "high",
      sla_uptime: 99.9,
      environment: "production",
    },
  },
  {
    project_key: "noid_labs",
    display_name: "NØID Labs",
    description: "AI Driver Automation - Next-generation automation platform",
    supabase_url: process.env.SUPABASE_URL,
    owner_email: "engineering@noidlabs.com",
    notification_emails: ["engineering@noidlabs.com"],
    is_active: true,
    config: {
      priority: "high",
      sla_uptime: 99.5,
      environment: "production",
    },
  },
  {
    project_key: "aurafx",
    display_name: "AuraFX",
    description: "Trading Signals Platform - Real-time market intelligence",
    supabase_url: process.env.SUPABASE_URL,
    owner_email: "engineering@aurafx.com",
    notification_emails: ["engineering@aurafx.com"],
    is_active: true,
    config: {
      priority: "medium",
      sla_uptime: 99.0,
      environment: "production",
    },
  },
  {
    project_key: "shared",
    display_name: "Shared Infrastructure",
    description: "Shared services and infrastructure components",
    supabase_url: process.env.SUPABASE_URL,
    owner_email: "ops@synqra.com",
    notification_emails: ["ops@synqra.com"],
    is_active: true,
    config: {
      priority: "critical",
      sla_uptime: 99.99,
      environment: "production",
    },
  },
];

// Services will be generated per project
function generateServicesForProject(projectId, projectKey) {
  return [
    {
      project_id: projectId,
      service_key: "postgres",
      display_name: `${projectKey.toUpperCase()} PostgreSQL`,
      description: "PostgreSQL database health check",
      check_interval_seconds: 300,
      timeout_ms: 10000,
      retry_count: 3,
      is_active: true,
      thresholds: {
        response_time_warning_ms: 1000,
        response_time_critical_ms: 5000,
        error_rate_warning: 0.05,
        error_rate_critical: 0.1,
      },
    },
    {
      project_id: projectId,
      service_key: "rest_api",
      display_name: `${projectKey.toUpperCase()} REST API`,
      description: "Supabase REST API health check",
      check_interval_seconds: 300,
      timeout_ms: 10000,
      retry_count: 3,
      is_active: true,
      thresholds: {
        response_time_warning_ms: 2000,
        response_time_critical_ms: 5000,
        error_rate_warning: 0.05,
        error_rate_critical: 0.1,
      },
    },
    {
      project_id: projectId,
      service_key: "auth",
      display_name: `${projectKey.toUpperCase()} Auth`,
      description: "Supabase Auth service health check",
      endpoint_url: `${process.env.SUPABASE_URL.replace("/rest/v1", "")}/auth/v1/health`,
      check_interval_seconds: 300,
      timeout_ms: 10000,
      retry_count: 3,
      is_active: true,
    },
    {
      project_id: projectId,
      service_key: "storage",
      display_name: `${projectKey.toUpperCase()} Storage`,
      description: "Supabase Storage service health check",
      endpoint_url: `${process.env.SUPABASE_URL.replace("/rest/v1", "")}/storage/v1/bucket`,
      check_interval_seconds: 300,
      timeout_ms: 10000,
      retry_count: 3,
      is_active: true,
    },
  ];
}

// Sample alert rules
function generateAlertRulesForService(serviceId, serviceName) {
  return [
    {
      service_id: serviceId,
      rule_name: `${serviceName} - High Consecutive Failures`,
      description: "Alert when service has 3+ consecutive failures",
      condition_type: "consecutive_failures",
      condition_config: {
        threshold: 3,
      },
      severity: "error",
      notification_channels: ["n8n"],
      cooldown_minutes: 30,
      is_active: true,
    },
    {
      service_id: serviceId,
      rule_name: `${serviceName} - Critical Response Time`,
      description: "Alert when response time exceeds 5 seconds",
      condition_type: "response_time",
      condition_config: {
        threshold_ms: 5000,
      },
      severity: "warning",
      notification_channels: ["n8n"],
      cooldown_minutes: 60,
      is_active: true,
    },
  ];
}

// Sample recovery actions
function generateRecoveryActionsForService(serviceId, serviceName) {
  return [
    {
      service_id: serviceId,
      action_name: `${serviceName} - Auto Restart`,
      action_type: "auto_restart",
      trigger_condition: "consecutive_failures >= 3",
      action_config: {
        wait_time_ms: 5000,
      },
      max_retries: 3,
      retry_delay_seconds: 60,
      is_enabled: true,
      priority: 1,
    },
    {
      service_id: serviceId,
      action_name: `${serviceName} - Escalate`,
      action_type: "escalate",
      trigger_condition: "consecutive_failures >= 5",
      action_config: {},
      max_retries: 1,
      retry_delay_seconds: 0,
      is_enabled: true,
      priority: 2,
    },
    {
      service_id: serviceId,
      action_name: `${serviceName} - Notify Only`,
      action_type: "notify_only",
      trigger_condition: "consecutive_failures >= 3",
      action_config: {},
      max_retries: 1,
      retry_delay_seconds: 0,
      is_enabled: true,
      priority: 3,
    },
  ];
}

// ==============================================
// SEEDING FUNCTIONS
// ==============================================

async function seedProjects() {
  console.log("📦 Seeding projects...");

  const projects = [];

  for (const project of PROJECTS) {
    try {
      // Check if project already exists
      const { data: existing } = await supabase
        .from("health_projects")
        .select("id, project_key")
        .eq("project_key", project.project_key)
        .single();

      if (existing) {
        console.log(`  ⏭️  Project '${project.project_key}' already exists, skipping`);
        projects.push(existing);
        continue;
      }

      // Insert new project
      const { data, error } = await supabase
        .from("health_projects")
        .insert([project])
        .select()
        .single();

      if (error) throw error;

      console.log(`  ✅ Created project: ${project.display_name}`);
      projects.push(data);
    } catch (error) {
      console.error(`  ❌ Failed to create project ${project.project_key}:`, error.message);
    }
  }

  return projects;
}

async function seedServices(projects) {
  console.log("\n🔧 Seeding services...");

  const services = [];

  for (const project of projects) {
    const projectServices = generateServicesForProject(project.id, project.project_key);

    for (const service of projectServices) {
      try {
        // Check if service already exists
        const { data: existing } = await supabase
          .from("health_services")
          .select("id")
          .eq("project_id", project.id)
          .eq("service_key", service.service_key)
          .single();

        if (existing) {
          console.log(`  ⏭️  Service '${service.display_name}' already exists, skipping`);
          services.push(existing);
          continue;
        }

        // Insert new service
        const { data, error } = await supabase
          .from("health_services")
          .insert([service])
          .select()
          .single();

        if (error) throw error;

        console.log(`  ✅ Created service: ${service.display_name}`);
        services.push(data);
      } catch (error) {
        console.error(`  ❌ Failed to create service ${service.display_name}:`, error.message);
      }
    }
  }

  return services;
}

async function seedAlertRules(services) {
  console.log("\n🚨 Seeding alert rules...");

  let totalRules = 0;

  for (const service of services) {
    const rules = generateAlertRulesForService(service.id, service.display_name);

    for (const rule of rules) {
      try {
        // Check if rule already exists
        const { data: existing } = await supabase
          .from("health_alert_rules")
          .select("id")
          .eq("service_id", service.id)
          .eq("rule_name", rule.rule_name)
          .single();

        if (existing) {
          continue; // Skip silently
        }

        const { error } = await supabase.from("health_alert_rules").insert([rule]);

        if (error) throw error;

        totalRules++;
      } catch (error) {
        // Ignore duplicates
      }
    }
  }

  console.log(`  ✅ Created ${totalRules} alert rules`);
}

async function seedRecoveryActions(services) {
  console.log("\n🔄 Seeding recovery actions...");

  let totalActions = 0;

  for (const service of services) {
    const actions = generateRecoveryActionsForService(service.id, service.display_name);

    for (const action of actions) {
      try {
        // Check if action already exists
        const { data: existing } = await supabase
          .from("health_recovery_actions")
          .select("id")
          .eq("service_id", service.id)
          .eq("action_name", action.action_name)
          .single();

        if (existing) {
          continue; // Skip silently
        }

        const { error } = await supabase.from("health_recovery_actions").insert([action]);

        if (error) throw error;

        totalActions++;
      } catch (error) {
        // Ignore duplicates
      }
    }
  }

  console.log(`  ✅ Created ${totalActions} recovery actions`);
}

// ==============================================
// MAIN EXECUTION
// ==============================================

async function main() {
  console.log("🚀 Enterprise Health Cell - Seed Data Script");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log("━".repeat(60));

  try {
    // Seed in order
    const projects = await seedProjects();
    const services = await seedServices(projects);
    await seedAlertRules(services);
    await seedRecoveryActions(services);

    console.log("\n━".repeat(60));
    console.log("✅ SUCCESS: Seed data initialized!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Services: ${services.length}`);
    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Test health monitor: node enterprise-health-monitor.mjs`);
    console.log(`   2. Check dashboard: http://localhost:3003`);

    process.exit(0);
  } catch (error) {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  }
}

main();
