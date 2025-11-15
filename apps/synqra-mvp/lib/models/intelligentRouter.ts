/**
 * ============================================================
 * INTELLIGENT MODEL ROUTER
 * ============================================================
 * Routes requests to optimal model based on complexity,
 * cost, latency, and quality requirements
 * 
 * Goal: 80% requests to local models, 20% to premium APIs
 */

import { RoutingDecision } from "./types";
import { MODEL_REGISTRY, getModelConfig } from "./modelRegistry";

export interface RouterConfig {
  preferLocal: boolean; // Prefer local models when possible
  maxCostPerRequest: number; // Maximum cost willing to pay
  maxLatencyMs: number; // Maximum acceptable latency
  qualityThreshold: number; // Minimum quality score (0-1)
  brandConsistencyRequired: boolean; // Requires brand DNA check
}

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  preferLocal: true,
  maxCostPerRequest: 0.02, // $0.02 max per request
  maxLatencyMs: 3000, // 3 seconds max
  qualityThreshold: 0.7,
  brandConsistencyRequired: false,
};

/**
 * Analyze query complexity
 */
export function analyzeComplexity(query: string): {
  complexity: "simple" | "medium" | "high" | "creative";
  confidence: number;
  features: {
    length: number;
    questionCount: number;
    technicalTerms: number;
    creativityRequired: boolean;
    brandSensitive: boolean;
  };
} {
  const length = query.length;
  const questionCount = (query.match(/\?/g) || []).length;
  
  // Simple heuristics for technical content
  const technicalKeywords = [
    "api", "database", "code", "error", "bug", "implement",
    "configure", "deploy", "technical", "integration"
  ];
  const technicalTerms = technicalKeywords.filter(keyword => 
    query.toLowerCase().includes(keyword)
  ).length;

  // Creative content indicators
  const creativeKeywords = [
    "creative", "design", "brand", "story", "emotional",
    "compelling", "engaging", "unique", "innovative"
  ];
  const creativityRequired = creativeKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );

  // Brand sensitivity indicators
  const brandKeywords = [
    "brand", "tone", "voice", "style", "identity",
    "luxury", "premium", "executive", "professional"
  ];
  const brandSensitive = brandKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );

  // Determine complexity
  let complexity: "simple" | "medium" | "high" | "creative";
  let confidence: number;

  if (creativityRequired || brandSensitive) {
    complexity = "creative";
    confidence = 0.9;
  } else if (length < 100 && questionCount <= 1 && technicalTerms === 0) {
    complexity = "simple";
    confidence = 0.85;
  } else if (length < 300 && questionCount <= 2) {
    complexity = "medium";
    confidence = 0.75;
  } else {
    complexity = "high";
    confidence = 0.7;
  }

  return {
    complexity,
    confidence,
    features: {
      length,
      questionCount,
      technicalTerms,
      creativityRequired,
      brandSensitive,
    },
  };
}

/**
 * Route request to optimal model
 */
export function routeToModel(
  query: string,
  config: Partial<RouterConfig> = {}
): RoutingDecision {
  const finalConfig = { ...DEFAULT_ROUTER_CONFIG, ...config };
  const analysis = analyzeComplexity(query);

  let selectedModel: string;
  let reason: string;
  const fallbackModels: string[] = [];

  // ========================================
  // ROUTING LOGIC
  // ========================================

  if (analysis.complexity === "simple" && finalConfig.preferLocal) {
    // Simple queries → Llama 3.2 1B (local, free)
    selectedModel = "llama-3.2-1b";
    reason = "Simple query, routing to local Llama 3.2 1B for zero-cost processing";
    fallbackModels.push("deepseek-v3", "claude-3.5-sonnet");
  } 
  else if (analysis.complexity === "medium" && finalConfig.preferLocal) {
    // Medium complexity → Try local first, fallback to DeepSeek
    if (finalConfig.maxCostPerRequest >= 0.008) {
      selectedModel = "deepseek-v3";
      reason = "Medium complexity, routing to DeepSeek V3 for balanced cost/quality";
      fallbackModels.push("llama-3.2-1b", "claude-3.5-sonnet");
    } else {
      selectedModel = "llama-3.2-1b";
      reason = "Budget constraint, using local Llama 3.2 1B";
      fallbackModels.push("deepseek-v3");
    }
  }
  else if (analysis.complexity === "creative" || analysis.features.brandSensitive) {
    // Creative/brand work → Claude 3.5 Sonnet (premium quality)
    selectedModel = "claude-3.5-sonnet";
    reason = "Creative/brand-sensitive content requires premium model (Claude)";
    fallbackModels.push("gpt-4o", "deepseek-v3");
  }
  else if (analysis.complexity === "high") {
    // High complexity → Premium API
    if (finalConfig.maxCostPerRequest >= 0.02) {
      selectedModel = "claude-3.5-sonnet";
      reason = "High complexity, routing to Claude 3.5 Sonnet for best quality";
      fallbackModels.push("gpt-4o", "deepseek-v3");
    } else if (finalConfig.maxCostPerRequest >= 0.008) {
      selectedModel = "deepseek-v3";
      reason = "High complexity but budget-conscious, using DeepSeek V3";
      fallbackModels.push("claude-3.5-sonnet");
    } else {
      selectedModel = "llama-3.2-1b";
      reason = "Tight budget, attempting with local Llama (quality may vary)";
      fallbackModels.push("deepseek-v3", "claude-3.5-sonnet");
    }
  }
  else {
    // Default fallback
    selectedModel = "llama-3.2-1b";
    reason = "Default routing to local model";
    fallbackModels.push("deepseek-v3", "claude-3.5-sonnet");
  }

  const modelConfig = getModelConfig(selectedModel);
  if (!modelConfig) {
    throw new Error(`Model not found in registry: ${selectedModel}`);
  }

  return {
    selectedModel,
    reason,
    complexity: analysis.complexity,
    confidence: analysis.confidence,
    fallbackModels,
    estimatedCost: modelConfig.costPerInference,
    estimatedLatency: modelConfig.avgLatencyMs,
  };
}

/**
 * Should escalate to premium model?
 */
export function shouldEscalate(
  qualityScore: number,
  currentModel: string,
  attempt: number = 1
): { escalate: boolean; nextModel?: string; reason: string } {
  const currentConfig = getModelConfig(currentModel);
  if (!currentConfig) {
    return {
      escalate: true,
      nextModel: "claude-3.5-sonnet",
      reason: "Unknown model, escalating to premium",
    };
  }

  // If already using premium model, don't escalate
  if (currentConfig.backend === "api" && currentModel.includes("claude")) {
    return {
      escalate: false,
      reason: "Already using premium model (Claude)",
    };
  }

  // Quality-based escalation
  if (qualityScore < 0.6 && attempt < 3) {
    const escalationPath: Record<string, string> = {
      "llama-3.2-1b": "deepseek-v3",
      "deepseek-v3": "claude-3.5-sonnet",
      "claude-3.5-sonnet": "gpt-4o",
    };

    const nextModel = escalationPath[currentModel];
    if (nextModel) {
      return {
        escalate: true,
        nextModel,
        reason: `Quality score ${qualityScore.toFixed(2)} too low, escalating from ${currentModel} to ${nextModel}`,
      };
    }
  }

  return {
    escalate: false,
    reason: `Quality score ${qualityScore.toFixed(2)} acceptable for ${currentModel}`,
  };
}

/**
 * Get routing statistics
 */
let routingStats = {
  totalRequests: 0,
  localRequests: 0,
  apiRequests: 0,
  costSaved: 0,
};

export function trackRouting(decision: RoutingDecision): void {
  routingStats.totalRequests += 1;

  const modelConfig = getModelConfig(decision.selectedModel);
  if (!modelConfig) return;

  if (modelConfig.backend === "api") {
    routingStats.apiRequests += 1;
  } else {
    routingStats.localRequests += 1;
    // Estimate cost saved (vs using Claude)
    const claudeConfig = getModelConfig("claude-3.5-sonnet");
    if (claudeConfig) {
      routingStats.costSaved += claudeConfig.costPerInference;
    }
  }
}

export function getRoutingStats(): {
  totalRequests: number;
  localPercentage: number;
  apiPercentage: number;
  costSaved: number;
  avgCostPerRequest: number;
} {
  const localPercentage = routingStats.totalRequests > 0
    ? (routingStats.localRequests / routingStats.totalRequests) * 100
    : 0;

  const apiPercentage = routingStats.totalRequests > 0
    ? (routingStats.apiRequests / routingStats.totalRequests) * 100
    : 0;

  const avgCostPerRequest = routingStats.totalRequests > 0
    ? (routingStats.costSaved / routingStats.totalRequests)
    : 0;

  return {
    totalRequests: routingStats.totalRequests,
    localPercentage,
    apiPercentage,
    costSaved: routingStats.costSaved,
    avgCostPerRequest,
  };
}

export function resetRoutingStats(): void {
  routingStats = {
    totalRequests: 0,
    localRequests: 0,
    apiRequests: 0,
    costSaved: 0,
  };
}
