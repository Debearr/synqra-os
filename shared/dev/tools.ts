/**
 * ============================================================
 * DEV TOOLS - NØID LABS
 * ============================================================
 * Development utilities for faster iteration
 * 
 * Apple/Tesla principle:
 * - Tools should be invisible until needed
 * - Debugging should be instant
 * - Testing should be effortless
 */

import { aiClient } from "../ai/client";
import { getSupabaseClient, getIntelligenceMetrics } from "../db/supabase";
import { cacheManager } from "../cache/intelligent-cache";
import { optimizer } from "../optimization/auto-optimizer";
import type { App } from "../types";

// ============================================================
// PERFORMANCE PROFILER
// ============================================================

export class PerformanceProfiler {
  private timers: Map<string, number> = new Map();
  private results: Map<string, number> = new Map();

  start(label: string): void {
    this.timers.set(label, performance.now());
  }

  end(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      console.warn(`No timer found for "${label}"`);
      return 0;
    }

    const duration = performance.now() - start;
    this.results.set(label, duration);
    this.timers.delete(label);

    return duration;
  }

  log(label: string): void {
    const duration = this.end(label);
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
  }

  summary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const [label, duration] of this.results.entries()) {
      summary[label] = Math.round(duration * 100) / 100;
    }
    return summary;
  }

  reset(): void {
    this.timers.clear();
    this.results.clear();
  }
}

export const profiler = new PerformanceProfiler();

// ============================================================
// DEBUG LOGGER
// ============================================================

export class DebugLogger {
  private enabled: boolean;
  private logs: Array<{ level: string; message: string; data?: any; timestamp: number }> = [];

  constructor(enabled: boolean = process.env.NODE_ENV === "development") {
    this.enabled = enabled;
  }

  debug(message: string, data?: any): void {
    if (!this.enabled) return;
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  private log(level: string, message: string, data?: any): void {
    const entry = {
      level,
      message,
      data,
      timestamp: Date.now(),
    };

    this.logs.push(entry);

    const icon = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[level] || "📝";

    console.log(`${icon} [${level.toUpperCase()}] ${message}`, data ? data : "");
  }

  getLogs(filter?: { level?: string; since?: number }): typeof this.logs {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.since) {
      filtered = filtered.filter((log) => log.timestamp >= filter.since);
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new DebugLogger();

// ============================================================
// SYSTEM DIAGNOSTICS
// ============================================================

export interface SystemHealth {
  overall: "healthy" | "degraded" | "critical";
  ai: { status: string; message?: string };
  database: { status: string; message?: string };
  cache: { status: string; hitRate?: number };
  optimization: { status: string; rulesActive?: number };
}

export async function runDiagnostics(app: App): Promise<SystemHealth> {
  const health: SystemHealth = {
    overall: "healthy",
    ai: { status: "unknown" },
    database: { status: "unknown" },
    cache: { status: "unknown" },
    optimization: { status: "unknown" },
  };

  // Check AI client
  try {
    const testResult = await aiClient.generate({
      prompt: "test",
      taskType: "formatting",
      maxTokens: 10,
    });
    health.ai = {
      status: testResult.content ? "healthy" : "degraded",
      message: testResult.model,
    };
  } catch (error) {
    health.ai = { status: "critical", message: (error as Error).message };
    health.overall = "critical";
  }

  // Check database
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("intelligence_logs").select("id").limit(1);
    health.database = {
      status: error ? "degraded" : "healthy",
      message: error?.message,
    };
    if (error) health.overall = "degraded";
  } catch (error) {
    health.database = { status: "critical", message: (error as Error).message };
    health.overall = "critical";
  }

  // Check cache
  try {
    const stats = await cacheManager.getGlobalStats();
    const avgHitRate = Object.values(stats).reduce((sum, s) => sum + s.hitRate, 0) / Object.keys(stats).length;
    health.cache = {
      status: avgHitRate > 30 ? "healthy" : "degraded",
      hitRate: Math.round(avgHitRate),
    };
  } catch (error) {
    health.cache = { status: "degraded" };
  }

  // Check optimization
  try {
    const appOptimizer = new (await import("../optimization/auto-optimizer")).AutoOptimizer(app);
    const rules = await appOptimizer.getRules();
    health.optimization = {
      status: rules.length > 0 ? "healthy" : "idle",
      rulesActive: rules.length,
    };
  } catch (error) {
    health.optimization = { status: "idle" };
  }

  return health;
}

// ============================================================
// QUICK TEST SUITE
// ============================================================

export async function quickTest(): Promise<{
  passed: number;
  failed: number;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
}> {
  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];

  // Test 1: AI generation
  try {
    const result = await aiClient.generate({
      prompt: "Write one sentence",
      taskType: "formatting",
      maxTokens: 50,
    });
    tests.push({
      name: "AI Generation",
      passed: result.content.length > 0,
    });
  } catch (error) {
    tests.push({
      name: "AI Generation",
      passed: false,
      error: (error as Error).message,
    });
  }

  // Test 2: Database connectivity
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("intelligence_logs").select("id").limit(1);
    tests.push({
      name: "Database Connectivity",
      passed: !error,
      error: error?.message,
    });
  } catch (error) {
    tests.push({
      name: "Database Connectivity",
      passed: false,
      error: (error as Error).message,
    });
  }

  // Test 3: Cache operations
  try {
    const { contentCache } = await import("../cache/intelligent-cache");
    await contentCache.set("test_key", { test: "value" });
    const retrieved = await contentCache.get("test_key");
    tests.push({
      name: "Cache Operations",
      passed: retrieved !== null,
    });
  } catch (error) {
    tests.push({
      name: "Cache Operations",
      passed: false,
      error: (error as Error).message,
    });
  }

  // Test 4: Validation
  try {
    const { validateContent } = await import("../validation");
    const result = validateContent("This is a test email content for validation.", "email");
    tests.push({
      name: "Content Validation",
      passed: result.score > 0,
    });
  } catch (error) {
    tests.push({
      name: "Content Validation",
      passed: false,
      error: (error as Error).message,
    });
  }

  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;

  return { passed, failed, tests };
}

// ============================================================
// DASHBOARD DATA
// ============================================================

export async function getDashboardData(app: App): Promise<{
  metrics: any;
  health: SystemHealth;
  cacheStats: any;
  recentOptimizations: number;
}> {
  const [metrics, health, cacheStats] = await Promise.all([
    getIntelligenceMetrics(app),
    runDiagnostics(app),
    cacheManager.getGlobalStats(),
  ]);

  // Count recent optimizations
  const supabase = getSupabaseClient();
  const { count } = await supabase
    .from("optimization_logs")
    .select("id", { count: "exact", head: true })
    .eq("app", app)
    .eq("applied", true)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return {
    metrics,
    health,
    cacheStats,
    recentOptimizations: count || 0,
  };
}

// ============================================================
// CLI HELPERS
// ============================================================

/**
 * Quick CLI command to check system status
 */
export async function statusCommand(app: App = "synqra"): Promise<void> {
  console.log("\n🔍 NØID LABS SYSTEM STATUS\n");

  const health = await runDiagnostics(app);

  console.log(`Overall: ${health.overall === "healthy" ? "✅" : "⚠️"} ${health.overall.toUpperCase()}`);
  console.log(`\nComponents:`);
  console.log(`  AI Client: ${health.ai.status === "healthy" ? "✅" : "❌"} ${health.ai.status} ${health.ai.message ? `(${health.ai.message})` : ""}`);
  console.log(`  Database: ${health.database.status === "healthy" ? "✅" : "❌"} ${health.database.status}`);
  console.log(`  Cache: ${health.cache.status === "healthy" ? "✅" : "⚠️"} ${health.cache.status} ${health.cache.hitRate ? `(${health.cache.hitRate}% hit rate)` : ""}`);
  console.log(`  Optimizer: ${health.optimization.status === "healthy" ? "✅" : "ℹ️"} ${health.optimization.status} ${health.optimization.rulesActive ? `(${health.optimization.rulesActive} rules)` : ""}`);

  console.log("\n");
}

/**
 * Quick CLI command to run tests
 */
export async function testCommand(): Promise<void> {
  console.log("\n🧪 RUNNING QUICK TESTS\n");

  const result = await quickTest();

  console.log(`Results: ${result.passed} passed, ${result.failed} failed\n`);

  for (const test of result.tests) {
    const icon = test.passed ? "✅" : "❌";
    console.log(`${icon} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  }

  console.log("\n");
}

/**
 * Quick CLI command to optimize
 */
export async function optimizeCommand(app: App = "synqra"): Promise<void> {
  console.log("\n⚡ RUNNING AUTO-OPTIMIZATION\n");

  const appOptimizer = new (await import("../optimization/auto-optimizer")).AutoOptimizer(app);
  const { applied, skipped } = await appOptimizer.autoOptimize();

  if (applied.length > 0) {
    console.log(`✅ Applied ${applied.length} optimizations:\n`);
    applied.forEach((opt) => {
      console.log(`  • ${opt.description}`);
      console.log(`    Expected gain: ${opt.expectedGain}% | Confidence: ${opt.confidence}%\n`);
    });
  } else {
    console.log("No high-confidence optimizations found.\n");
  }

  if (skipped.length > 0) {
    console.log(`⏭️  Skipped ${skipped.length} low-confidence optimizations.\n`);
  }

  console.log("\n");
}
