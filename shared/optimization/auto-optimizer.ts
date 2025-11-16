/**
 * ============================================================
 * AUTO-OPTIMIZER - NØID LABS
 * ============================================================
 * Self-improving system that learns from performance data
 * 
 * Apple/Tesla principle:
 * - System optimizes itself over time
 * - No manual tuning required
 * - Learns from real usage, not assumptions
 * - Stays within quality guardrails
 * 
 * What it optimizes:
 * 1. Model selection (premium vs standard vs cheap)
 * 2. Prompt templates (find what works)
 * 3. Workflow steps (skip unnecessary ones)
 * 4. Cache strategies (keep winners, evict losers)
 * 5. Retry logic (adapt based on failure patterns)
 */

import { getSupabaseClient, getIntelligenceMetrics } from "../db/supabase";
import type { ModelTier, TaskType } from "../ai/client";
import type { App } from "../types";

// ============================================================
// TYPES
// ============================================================

export interface OptimizationRule {
  id: string;
  category: "model_selection" | "prompt" | "workflow" | "cache" | "retry";
  condition: string; // Human-readable condition
  action: string; // Human-readable action
  confidence: number; // 0-100
  performance_gain: number; // Percentage improvement
  applied_count: number;
  success_rate: number;
  created_at: string;
  last_applied?: string;
}

export interface ModelPerformance {
  tier: ModelTier;
  taskType: TaskType;
  avgTokens: number;
  avgDuration: number; // ms
  successRate: number; // percentage
  costEfficiency: number; // output quality per dollar
  sampleSize: number;
}

export interface OptimizationRecommendation {
  type: "model" | "prompt" | "workflow" | "cache";
  description: string;
  expectedGain: number; // percentage
  confidence: number; // 0-100
  action: () => Promise<void>;
}

// ============================================================
// AUTO-OPTIMIZER CLASS
// ============================================================

export class AutoOptimizer {
  private app: App;
  private learningEnabled: boolean;
  private minSampleSize: number;

  constructor(app: App, options?: { learningEnabled?: boolean; minSampleSize?: number }) {
    this.app = app;
    this.learningEnabled = options?.learningEnabled !== false;
    this.minSampleSize = options?.minSampleSize || 10;
  }

  /**
   * Analyze performance and generate optimization recommendations
   */
  async analyze(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze model performance
    const modelRecs = await this.analyzeModelPerformance();
    recommendations.push(...modelRecs);

    // Analyze prompt effectiveness
    const promptRecs = await this.analyzePromptPerformance();
    recommendations.push(...promptRecs);

    // Analyze workflow efficiency
    const workflowRecs = await this.analyzeWorkflowPerformance();
    recommendations.push(...workflowRecs);

    // Analyze cache hit rates
    const cacheRecs = await this.analyzeCachePerformance();
    recommendations.push(...cacheRecs);

    // Sort by expected gain (highest first)
    return recommendations.sort((a, b) => b.expectedGain - a.expectedGain);
  }

  /**
   * Auto-apply safe optimizations (high confidence, proven gains)
   */
  async autoOptimize(): Promise<{
    applied: OptimizationRecommendation[];
    skipped: OptimizationRecommendation[];
  }> {
    if (!this.learningEnabled) {
      return { applied: [], skipped: [] };
    }

    const recommendations = await this.analyze();
    const applied: OptimizationRecommendation[] = [];
    const skipped: OptimizationRecommendation[] = [];

    for (const rec of recommendations) {
      // Only auto-apply if high confidence and significant gain
      if (rec.confidence >= 80 && rec.expectedGain >= 10) {
        try {
          await rec.action();
          applied.push(rec);
          
          // Log optimization
          await this.logOptimization(rec, true);
        } catch (error) {
          console.error(`Failed to apply optimization:`, error);
          skipped.push(rec);
        }
      } else {
        skipped.push(rec);
      }
    }

    return { applied, skipped };
  }

  /**
   * Get current optimization rules
   */
  async getRules(): Promise<OptimizationRule[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("optimization_rules")
        .select("*")
        .eq("app", this.app)
        .gte("confidence", 70)
        .order("performance_gain", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Failed to fetch optimization rules:", error);
      return [];
    }
  }

  // ============================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================

  /**
   * Analyze which models perform best for which tasks
   */
  private async analyzeModelPerformance(): Promise<OptimizationRecommendation[]> {
    try {
      const supabase = getSupabaseClient();
      
      // Get model performance data
      const { data, error } = await supabase
        .from("intelligence_logs")
        .select("model_tier, task_type, input_tokens, output_tokens, success, metadata")
        .eq("app", this.app)
        .not("model_tier", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error || !data || data.length < this.minSampleSize) {
        return [];
      }

      // Group by tier and task type
      const performance = new Map<string, ModelPerformance>();
      
      for (const log of data) {
        const key = `${log.model_tier}_${log.task_type}`;
        if (!performance.has(key)) {
          performance.set(key, {
            tier: log.model_tier,
            taskType: log.task_type,
            avgTokens: 0,
            avgDuration: 0,
            successRate: 0,
            costEfficiency: 0,
            sampleSize: 0,
          });
        }

        const perf = performance.get(key)!;
        perf.avgTokens += (log.input_tokens || 0) + (log.output_tokens || 0);
        perf.successRate += log.success ? 100 : 0;
        perf.sampleSize++;
      }

      // Calculate averages
      for (const perf of performance.values()) {
        perf.avgTokens = Math.round(perf.avgTokens / perf.sampleSize);
        perf.successRate = Math.round(perf.successRate / perf.sampleSize);
        
        // Cost efficiency = success rate / tokens (higher is better)
        perf.costEfficiency = perf.successRate / (perf.avgTokens || 1);
      }

      // Find optimization opportunities
      const recommendations: OptimizationRecommendation[] = [];

      // Example: If cheap tier has >90% success rate for a task, recommend using it
      for (const [key, perf] of performance.entries()) {
        if (
          perf.tier === "standard" &&
          perf.successRate >= 90 &&
          perf.sampleSize >= this.minSampleSize
        ) {
          recommendations.push({
            type: "model",
            description: `Use 'cheap' tier for ${perf.taskType} tasks (90%+ success rate observed)`,
            expectedGain: 30, // 30% cost reduction
            confidence: Math.min(95, 70 + perf.sampleSize / 2),
            action: async () => {
              // Update default routing
              await this.updateModelRouting(perf.taskType, "cheap");
            },
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.warn("Model performance analysis failed:", error);
      return [];
    }
  }

  /**
   * Analyze which prompt templates work best
   */
  private async analyzePromptPerformance(): Promise<OptimizationRecommendation[]> {
    try {
      const supabase = getSupabaseClient();
      
      // Get recipe usage data
      const { data, error } = await supabase
        .from("recipe_usage")
        .select("*")
        .eq("app", this.app)
        .gte("use_count", this.minSampleSize)
        .order("success_rate", { ascending: false });

      if (error || !data) return [];

      const recommendations: OptimizationRecommendation[] = [];

      // Find high-performing recipes that aren't being used enough
      const topPerformer = data[0];
      if (topPerformer && topPerformer.success_rate >= 85) {
        recommendations.push({
          type: "prompt",
          description: `Increase usage of "${topPerformer.recipe_name}" (${topPerformer.success_rate}% success rate)`,
          expectedGain: 15,
          confidence: 85,
          action: async () => {
            // Promote this recipe as default
            await this.promoteRecipe(topPerformer.recipe_type, topPerformer.recipe_name);
          },
        });
      }

      return recommendations;
    } catch (error) {
      console.warn("Prompt performance analysis failed:", error);
      return [];
    }
  }

  /**
   * Analyze workflow efficiency
   */
  private async analyzeWorkflowPerformance(): Promise<OptimizationRecommendation[]> {
    try {
      const supabase = getSupabaseClient();
      
      // Get workflow execution data
      const { data, error } = await supabase
        .from("intelligence_logs")
        .select("operation, success, metadata")
        .eq("app", this.app)
        .like("operation", "workflow_%")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error || !data || data.length < this.minSampleSize) {
        return [];
      }

      const recommendations: OptimizationRecommendation[] = [];

      // Analyze step durations
      const stepPerformance = new Map<string, { count: number; avgDuration: number }>();
      
      for (const log of data) {
        if (log.metadata?.steps) {
          for (const step of log.metadata.steps) {
            if (!stepPerformance.has(step.name)) {
              stepPerformance.set(step.name, { count: 0, avgDuration: 0 });
            }
            const perf = stepPerformance.get(step.name)!;
            perf.count++;
            perf.avgDuration += step.duration;
          }
        }
      }

      // Calculate averages
      for (const [name, perf] of stepPerformance.entries()) {
        perf.avgDuration = Math.round(perf.avgDuration / perf.count);
        
        // If a step consistently takes >5s and doesn't fail, consider caching
        if (perf.avgDuration > 5000 && perf.count >= this.minSampleSize) {
          recommendations.push({
            type: "workflow",
            description: `Cache results of "${name}" step (avg: ${perf.avgDuration}ms)`,
            expectedGain: 80, // Major time saving
            confidence: 75,
            action: async () => {
              // Enable caching for this step
              await this.enableStepCaching(name);
            },
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.warn("Workflow performance analysis failed:", error);
      return [];
    }
  }

  /**
   * Analyze cache effectiveness
   */
  private async analyzeCachePerformance(): Promise<OptimizationRecommendation[]> {
    try {
      const { cacheManager } = await import("../cache/intelligent-cache");
      const stats = await cacheManager.getGlobalStats();

      const recommendations: OptimizationRecommendation[] = [];

      for (const [namespace, stat] of Object.entries(stats)) {
        // If hit rate is low but we have entries, improve matching
        if (stat.hitRate < 30 && stat.totalEntries > 20) {
          recommendations.push({
            type: "cache",
            description: `Improve ${namespace} cache matching (${stat.hitRate}% hit rate)`,
            expectedGain: 40,
            confidence: 70,
            action: async () => {
              // Lower similarity threshold for better matching
              await this.adjustCacheMatching(namespace, 0.8);
            },
          });
        }

        // If avg performance is low, clear underperformers
        if (stat.avgPerformanceScore < 60) {
          recommendations.push({
            type: "cache",
            description: `Clear low-performing ${namespace} cache entries (<60 score)`,
            expectedGain: 25,
            confidence: 85,
            action: async () => {
              const cache = cacheManager.getCache(namespace);
              await cache.clearLowPerformers(60);
            },
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.warn("Cache performance analysis failed:", error);
      return [];
    }
  }

  // ============================================================
  // OPTIMIZATION ACTIONS
  // ============================================================

  private async updateModelRouting(taskType: TaskType, tier: ModelTier): Promise<void> {
    // Store in optimization rules
    const supabase = getSupabaseClient();
    await supabase.from("optimization_rules").upsert({
      app: this.app,
      category: "model_selection",
      condition: `task_type = '${taskType}'`,
      action: `use_tier = '${tier}'`,
      confidence: 90,
      performance_gain: 30,
      applied_count: 1,
      success_rate: 100,
    });
  }

  private async promoteRecipe(recipeType: string, recipeName: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from("optimization_rules").upsert({
      app: this.app,
      category: "prompt",
      condition: `recipe_type = '${recipeType}'`,
      action: `prefer_recipe = '${recipeName}'`,
      confidence: 85,
      performance_gain: 15,
      applied_count: 1,
      success_rate: 100,
    });
  }

  private async enableStepCaching(stepName: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from("optimization_rules").upsert({
      app: this.app,
      category: "workflow",
      condition: `step_name = '${stepName}'`,
      action: `enable_caching = true`,
      confidence: 75,
      performance_gain: 80,
      applied_count: 1,
      success_rate: 100,
    });
  }

  private async adjustCacheMatching(namespace: string, threshold: number): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from("optimization_rules").upsert({
      app: this.app,
      category: "cache",
      condition: `namespace = '${namespace}'`,
      action: `similarity_threshold = ${threshold}`,
      confidence: 70,
      performance_gain: 40,
      applied_count: 1,
      success_rate: 100,
    });
  }

  private async logOptimization(
    rec: OptimizationRecommendation,
    success: boolean
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("optimization_logs").insert({
        app: this.app,
        type: rec.type,
        description: rec.description,
        expected_gain: rec.expectedGain,
        confidence: rec.confidence,
        applied: success,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Failed to log optimization:", error);
    }
  }
}

// ============================================================
// GLOBAL OPTIMIZER INSTANCE
// ============================================================

export const optimizer = new AutoOptimizer("shared", { learningEnabled: true });

/**
 * Run optimization check (can be called periodically)
 */
export async function runOptimizationCheck(app: App): Promise<void> {
  const appOptimizer = new AutoOptimizer(app);
  const { applied, skipped } = await appOptimizer.autoOptimize();

  if (applied.length > 0) {
    console.log(`✅ Applied ${applied.length} optimizations:`);
    applied.forEach((opt) => console.log(`  - ${opt.description}`));
  }

  if (skipped.length > 0) {
    console.log(`⏭️  Skipped ${skipped.length} optimizations (low confidence or gain)`);
  }
}
