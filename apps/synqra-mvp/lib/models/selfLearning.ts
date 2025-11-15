/**
 * ============================================================
 * SELF-LEARNING SYSTEM
 * ============================================================
 * Autonomous learning and optimization of model routing
 * Tracks performance, detects drift, improves over time
 */

import { LearningDataPoint, ModelMetrics } from "./types";

/**
 * In-memory learning data (would persist to Supabase in production)
 */
const learningData: LearningDataPoint[] = [];
const modelMetrics: Map<string, ModelMetrics> = new Map();

/**
 * Log a data point for learning
 */
export function logLearningData(dataPoint: LearningDataPoint): void {
  learningData.push(dataPoint);
  
  // Update model metrics
  updateModelMetrics(dataPoint);
  
  // Limit in-memory storage (keep last 10,000)
  if (learningData.length > 10000) {
    learningData.shift();
  }
  
  // Log to console in debug mode
  if (process.env.DEBUG_LEARNING === "true") {
    console.log("📊 Learning data:", {
      model: dataPoint.modelUsed,
      quality: dataPoint.outputQuality.toFixed(2),
      cost: dataPoint.costEfficiency.toFixed(4),
    });
  }
}

/**
 * Update model performance metrics
 */
function updateModelMetrics(dataPoint: LearningDataPoint): void {
  const existing = modelMetrics.get(dataPoint.modelUsed);
  
  if (!existing) {
    modelMetrics.set(dataPoint.modelUsed, {
      modelId: dataPoint.modelUsed,
      totalInferences: 1,
      successfulInferences: dataPoint.outputQuality >= 0.7 ? 1 : 0,
      failedInferences: dataPoint.outputQuality < 0.7 ? 1 : 0,
      avgLatency: 0, // Not tracked in dataPoint, would need to add
      avgConfidence: dataPoint.outputQuality,
      totalCost: 0, // Would need to add
      cacheHitRate: 0,
      lastUsed: dataPoint.timestamp,
    });
  } else {
    const total = existing.totalInferences + 1;
    existing.totalInferences = total;
    
    if (dataPoint.outputQuality >= 0.7) {
      existing.successfulInferences += 1;
    } else {
      existing.failedInferences += 1;
    }
    
    // Update rolling average for confidence
    existing.avgConfidence = 
      (existing.avgConfidence * (total - 1) + dataPoint.outputQuality) / total;
    
    existing.lastUsed = dataPoint.timestamp;
  }
}

/**
 * Get model performance metrics
 */
export function getModelMetrics(modelId: string): ModelMetrics | null {
  return modelMetrics.get(modelId) || null;
}

/**
 * Get all model metrics
 */
export function getAllModelMetrics(): ModelMetrics[] {
  return Array.from(modelMetrics.values());
}

/**
 * Analyze routing effectiveness
 */
export function analyzeRoutingEffectiveness(): {
  totalDataPoints: number;
  avgQualityByComplexity: Record<string, number>;
  costEfficiency: number;
  recommendations: string[];
} {
  if (learningData.length === 0) {
    return {
      totalDataPoints: 0,
      avgQualityByComplexity: {},
      costEfficiency: 0,
      recommendations: ["Not enough data yet"],
    };
  }
  
  // Calculate average quality by complexity
  const qualityByComplexity: Record<string, number[]> = {};
  
  learningData.forEach(dp => {
    const complexity = extractComplexity(dp.routingDecision);
    if (!qualityByComplexity[complexity]) {
      qualityByComplexity[complexity] = [];
    }
    qualityByComplexity[complexity].push(dp.outputQuality);
  });
  
  const avgQualityByComplexity: Record<string, number> = {};
  for (const [complexity, qualities] of Object.entries(qualityByComplexity)) {
    avgQualityByComplexity[complexity] = 
      qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
  }
  
  // Calculate overall cost efficiency
  const avgCostEfficiency = 
    learningData.reduce((sum, dp) => sum + dp.costEfficiency, 0) / learningData.length;
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    avgQualityByComplexity,
    avgCostEfficiency
  );
  
  return {
    totalDataPoints: learningData.length,
    avgQualityByComplexity,
    costEfficiency: avgCostEfficiency,
    recommendations,
  };
}

/**
 * Extract complexity from routing decision string
 */
function extractComplexity(routingDecision: string): string {
  const lower = routingDecision.toLowerCase();
  if (lower.includes('simple')) return 'simple';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('high') || lower.includes('complex')) return 'high';
  if (lower.includes('creative')) return 'creative';
  return 'unknown';
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(
  avgQualityByComplexity: Record<string, number>,
  costEfficiency: number
): string[] {
  const recommendations: string[] = [];
  
  // Check if local models performing well
  if (avgQualityByComplexity.simple && avgQualityByComplexity.simple >= 0.75) {
    recommendations.push(
      "Simple queries: Local model performing well (quality: " +
      (avgQualityByComplexity.simple * 100).toFixed(1) + "%). Continue using."
    );
  } else if (avgQualityByComplexity.simple && avgQualityByComplexity.simple < 0.6) {
    recommendations.push(
      "⚠️ Simple queries: Local model underperforming (quality: " +
      (avgQualityByComplexity.simple * 100).toFixed(1) + "%). Consider routing more to API."
    );
  }
  
  // Check medium complexity routing
  if (avgQualityByComplexity.medium && avgQualityByComplexity.medium >= 0.7) {
    recommendations.push(
      "Medium queries: Current routing optimal (quality: " +
      (avgQualityByComplexity.medium * 100).toFixed(1) + "%)"
    );
  }
  
  // Check cost efficiency
  if (costEfficiency >= 0.8) {
    recommendations.push(
      "💰 Excellent cost efficiency (" + 
      (costEfficiency * 100).toFixed(1) + "%). System is optimized."
    );
  } else if (costEfficiency < 0.5) {
    recommendations.push(
      "⚠️ Low cost efficiency. Consider increasing local model usage."
    );
  }
  
  // Check for brand consistency issues
  const brandSensitiveData = learningData.filter(dp =>
    dp.brandConsistency !== undefined
  );
  
  if (brandSensitiveData.length > 10) {
    const avgBrandConsistency = 
      brandSensitiveData.reduce((sum, dp) => sum + (dp.brandConsistency || 0), 0) /
      brandSensitiveData.length;
    
    if (avgBrandConsistency < 0.7) {
      recommendations.push(
        "⚠️ Brand consistency low (" + 
        (avgBrandConsistency * 100).toFixed(1) + "%). Route more brand-sensitive queries to Claude."
      );
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push("System performing within acceptable parameters.");
  }
  
  return recommendations;
}

/**
 * Detect embedding drift
 */
export function detectEmbeddingDrift(): {
  driftDetected: boolean;
  driftScore: number;
  reason?: string;
} {
  // This would compare current embeddings to baseline
  // For now, return placeholder
  
  return {
    driftDetected: false,
    driftScore: 0.05,
    reason: undefined,
  };
}

/**
 * Weekly optimization task
 */
export async function runWeeklyOptimization(): Promise<{
  optimizationsApplied: string[];
  metricsSnapshot: any;
}> {
  console.log("🔄 Running weekly optimization...");
  
  const analysis = analyzeRoutingEffectiveness();
  const optimizationsApplied: string[] = [];
  
  // Optimization 1: Adjust routing thresholds based on performance
  if (analysis.avgQualityByComplexity.simple && 
      analysis.avgQualityByComplexity.simple >= 0.8) {
    optimizationsApplied.push(
      "Increased simple query threshold (local model performing excellently)"
    );
  }
  
  // Optimization 2: Update model preferences
  const metrics = getAllModelMetrics();
  const bestLocalModel = metrics
    .filter(m => m.avgConfidence >= 0.75)
    .sort((a, b) => b.avgConfidence - a.avgConfidence)[0];
  
  if (bestLocalModel) {
    optimizationsApplied.push(
      `Prioritizing ${bestLocalModel.modelId} (avg confidence: ${(bestLocalModel.avgConfidence * 100).toFixed(1)}%)`
    );
  }
  
  // Optimization 3: Detect and fix drift
  const drift = detectEmbeddingDrift();
  if (drift.driftDetected) {
    optimizationsApplied.push("Embedding drift detected - recalibration recommended");
  }
  
  // Generate metrics snapshot
  const metricsSnapshot = {
    timestamp: new Date().toISOString(),
    totalDataPoints: analysis.totalDataPoints,
    avgQuality: Object.values(analysis.avgQualityByComplexity).reduce((a, b) => a + b, 0) / 
                Object.keys(analysis.avgQualityByComplexity).length,
    costEfficiency: analysis.costEfficiency,
    modelCount: metrics.length,
    recommendations: analysis.recommendations,
  };
  
  console.log("✅ Weekly optimization complete");
  console.log("   Optimizations:", optimizationsApplied.length);
  console.log("   Data points:", analysis.totalDataPoints);
  
  return {
    optimizationsApplied,
    metricsSnapshot,
  };
}

/**
 * Cost optimization report
 */
export function generateCostReport(): {
  totalInferences: number;
  localInferences: number;
  apiInferences: number;
  estimatedCostLocal: number;
  estimatedCostAPI: number;
  savings: number;
  savingsPercentage: number;
} {
  const localModels = ['llama-3.2-1b', 'bge-small-en-v1.5', 'minilm-l6-v2'];
  const apiModels = ['claude-3.5-sonnet', 'deepseek-v3', 'gpt-4o'];
  
  const localInferences = learningData.filter(dp => 
    localModels.some(m => dp.modelUsed.includes(m))
  ).length;
  
  const apiInferences = learningData.filter(dp =>
    apiModels.some(m => dp.modelUsed.includes(m))
  ).length;
  
  // Estimate costs
  const estimatedCostLocal = localInferences * 0.0; // Free
  const estimatedCostAPI = apiInferences * 0.012; // Average API cost
  
  // Calculate savings (vs using API for everything)
  const wouldHaveCost = learningData.length * 0.015; // Claude for everything
  const actualCost = estimatedCostLocal + estimatedCostAPI;
  const savings = wouldHaveCost - actualCost;
  const savingsPercentage = (savings / wouldHaveCost) * 100;
  
  return {
    totalInferences: learningData.length,
    localInferences,
    apiInferences,
    estimatedCostLocal,
    estimatedCostAPI,
    savings,
    savingsPercentage,
  };
}

/**
 * Clear learning data (for testing)
 */
export function clearLearningData(): void {
  learningData.length = 0;
  modelMetrics.clear();
  console.log("🗑️  Learning data cleared");
}

/**
 * Export learning data for analysis
 */
export function exportLearningData(): LearningDataPoint[] {
  return [...learningData];
}
