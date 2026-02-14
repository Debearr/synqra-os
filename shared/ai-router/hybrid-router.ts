/**
 * ============================================================
 * HYBRID AI ROUTER - 80/20 COST OPTIMIZATION
 * ============================================================
 * Routes 80% of traffic to local HuggingFace models
 * Routes 20% to external APIs (DeepSeek, Claude, GPT-5)
 * Includes brand consistency checks and toxicity filtering
 */

import { getCurrentProject, checkBudgetCompliance, logAudit } from '../guardrails/project-isolation';

export type ModelProvider = 'local-llama' | 'local-embedding' | 'deepseek' | 'claude' | 'gpt-4o' | 'gpt-5';

export interface RoutingRequest {
  input: string;
  taskType: 'embedding' | 'generation' | 'brand-check' | 'safety-check' | 'reasoning';
  complexity?: number;
  requiresBrand?: boolean;
  isClientFacing?: boolean;
  maxCost?: number;
}

export interface RoutingDecision {
  provider: ModelProvider;
  model: string;
  estimatedCost: number;
  isLocal: boolean;
  reason: string;
  pipeline?: string[];
}

export interface RoutingMetrics {
  totalRequests: number;
  localRequests: number;
  externalRequests: number;
  localPercentage: number;
  totalCost: number;
  savedCost: number;
}

/**
 * ROUTING METRICS (In-memory, persist to Supabase in production)
 */
let metrics: RoutingMetrics = {
  totalRequests: 0,
  localRequests: 0,
  externalRequests: 0,
  localPercentage: 0,
  totalCost: 0,
  savedCost: 0,
};

/**
 * MODEL COSTS (per 1M tokens)
 */
const MODEL_COSTS = {
  'local-llama': 0, // Free (local inference)
  'local-embedding': 0, // Free (sentence-transformers)
  'deepseek-v3': 0.27, // Input cost
  'claude-3.5-sonnet': 3.00,
  'gpt-4o': 5.00,
  'gpt-5': 10.00,
};

/**
 * ROUTING THRESHOLDS
 */
const ROUTING_CONFIG = {
  localPercentageTarget: 80,
  complexityThresholdForExternal: 0.7,
  brandCheckLocal: true, // Use OpenCLIP locally
  safetyCheckLocal: true, // Use local toxicity model
};

/**
 * MAIN ROUTING FUNCTION
 * Implements 80/20 local/external split
 */
export async function route(request: RoutingRequest): Promise<RoutingDecision> {
  const project = getCurrentProject();
  
  if (!project) {
    throw new Error('No project context found. Cannot route request.');
  }

  // Log request attempt
  logAudit({
    project: project.name,
    action: 'route_request',
    success: true,
    metadata: { taskType: request.taskType },
  });

  // STEP 1: Handle embedding requests (always local)
  if (request.taskType === 'embedding') {
    metrics.totalRequests++;
    metrics.localRequests++;
    updateLocalPercentage();
    
    return {
      provider: 'local-embedding',
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      estimatedCost: 0,
      isLocal: true,
      reason: 'Embedding requests always use local model',
    };
  }

  // STEP 2: Handle brand consistency checks (local with OpenCLIP)
  if (request.taskType === 'brand-check' || request.requiresBrand) {
    if (ROUTING_CONFIG.brandCheckLocal) {
      metrics.totalRequests++;
      metrics.localRequests++;
      updateLocalPercentage();
      
      return {
        provider: 'local-llama',
        model: 'openai/clip-vit-base-patch32',
        estimatedCost: 0,
        isLocal: true,
        reason: 'Brand checks use local OpenCLIP model',
        pipeline: ['brand-check-local'],
      };
    }
  }

  // STEP 3: Handle safety checks (local toxicity filter)
  if (request.taskType === 'safety-check') {
    if (ROUTING_CONFIG.safetyCheckLocal) {
      metrics.totalRequests++;
      metrics.localRequests++;
      updateLocalPercentage();
      
      return {
        provider: 'local-llama',
        model: 'unitary/toxic-bert',
        estimatedCost: 0,
        isLocal: true,
        reason: 'Safety checks use local toxicity model',
        pipeline: ['safety-check-local'],
      };
    }
  }

  // STEP 4: Determine complexity
  const complexity = request.complexity || estimateComplexity(request.input, request.taskType);

  // STEP 5: Check if we should force local (maintain 80/20 ratio)
  const shouldForceLocal = shouldUseLocal(complexity);

  // STEP 6: Route based on complexity and constraints
  if (shouldForceLocal && complexity < ROUTING_CONFIG.complexityThresholdForExternal) {
    // Route to local Llama
    metrics.totalRequests++;
    metrics.localRequests++;
    updateLocalPercentage();
    
    const savedCost = estimateExternalCost(request.input);
    metrics.savedCost += savedCost;
    
    return {
      provider: 'local-llama',
      model: 'meta-llama/Llama-3.2-1B',
      estimatedCost: 0,
      isLocal: true,
      reason: `Local routing (complexity: ${complexity.toFixed(2)}, maintaining 80/20 ratio)`,
      pipeline: ['local-inference'],
    };
  }

  // STEP 7: Route to external API (20% of traffic)
  const externalDecision = routeToExternal(request, complexity);
  
  metrics.totalRequests++;
  metrics.externalRequests++;
  metrics.totalCost += externalDecision.estimatedCost;
  updateLocalPercentage();

  // Validate budget compliance
  checkBudgetCompliance(project.name, externalDecision.estimatedCost, 'perRequest');

  return externalDecision;
}

/**
 * ROUTE TO EXTERNAL API
 * Selects optimal external provider based on task requirements
 */
function routeToExternal(request: RoutingRequest, complexity: number): RoutingDecision {
  // High complexity or client-facing: Use Claude or GPT
  if (complexity > 0.85 || request.isClientFacing) {
    const model = request.isClientFacing ? 'gpt-4o' : 'claude-3.5-sonnet';
    const cost = estimateCost(request.input, MODEL_COSTS[model]);
    
    return {
      provider: model as ModelProvider,
      model,
      estimatedCost: cost,
      isLocal: false,
      reason: `High complexity (${complexity.toFixed(2)}) or client-facing, using premium model`,
      pipeline: ['external-api', 'quality-check'],
    };
  }

  // Medium complexity: Use DeepSeek
  if (complexity > 0.5) {
    const cost = estimateCost(request.input, MODEL_COSTS['deepseek-v3']);
    
    return {
      provider: 'deepseek',
      model: 'deepseek-v3',
      estimatedCost: cost,
      isLocal: false,
      reason: `Medium complexity (${complexity.toFixed(2)}), DeepSeek optimal`,
      pipeline: ['external-api', 'deepseek'],
    };
  }

  // Default: Use local with validation
  return {
    provider: 'local-llama',
    model: 'meta-llama/Llama-3.2-1B',
    estimatedCost: 0,
    isLocal: true,
    reason: 'Complexity below external threshold, using local model',
    pipeline: ['local-inference', 'validation'],
  };
}

/**
 * SHOULD USE LOCAL
 * Determines if request should use local model to maintain 80/20 ratio
 */
function shouldUseLocal(complexity: number): boolean {
  const currentLocalPercentage = metrics.localPercentage;
  const target = ROUTING_CONFIG.localPercentageTarget;

  // If we're below target, strongly prefer local
  if (currentLocalPercentage < target - 5) {
    return true;
  }

  // If we're above target, allow more external
  if (currentLocalPercentage > target + 5) {
    return false;
  }

  // If complexity is very high, allow external even if at target
  if (complexity > 0.9) {
    return false;
  }

  // Default: maintain ratio
  return currentLocalPercentage < target;
}

/**
 * ESTIMATE COMPLEXITY
 * Scores request complexity (0-1)
 */
function estimateComplexity(input: string, taskType: string): number {
  let complexity = 0;

  // Length factor
  if (input.length > 1000) complexity += 0.3;
  else if (input.length > 500) complexity += 0.2;
  else if (input.length > 200) complexity += 0.1;

  // Task type factor
  const taskComplexity: Record<string, number> = {
    'embedding': 0.1,
    'generation': 0.4,
    'brand-check': 0.3,
    'safety-check': 0.2,
    'reasoning': 0.6,
  };
  complexity += taskComplexity[taskType] || 0.4;

  // Keyword indicators
  const complexKeywords = ['analyze', 'compare', 'design', 'strategy', 'complex', 'detailed'];
  const hasComplexKeyword = complexKeywords.some(kw => input.toLowerCase().includes(kw));
  if (hasComplexKeyword) complexity += 0.2;

  return Math.min(complexity, 1.0);
}

/**
 * ESTIMATE COST
 * Calculates estimated cost for external API call
 */
function estimateCost(input: string, costPer1M: number): number {
  const tokens = Math.ceil(input.length / 4); // Rough estimate: 4 chars = 1 token
  const outputTokens = tokens * 0.5; // Assume 50% output ratio
  const totalTokens = tokens + outputTokens;
  
  return (totalTokens / 1_000_000) * costPer1M;
}

/**
 * ESTIMATE EXTERNAL COST
 * Estimates cost if request were sent to external API
 */
function estimateExternalCost(input: string): number {
  // Use average external cost (DeepSeek as baseline)
  return estimateCost(input, MODEL_COSTS['deepseek-v3']);
}

/**
 * UPDATE LOCAL PERCENTAGE
 */
function updateLocalPercentage(): void {
  if (metrics.totalRequests > 0) {
    metrics.localPercentage = (metrics.localRequests / metrics.totalRequests) * 100;
  }
}

/**
 * GET ROUTING METRICS
 */
export function getRoutingMetrics(): RoutingMetrics {
  return { ...metrics };
}

/**
 * RESET METRICS (for testing)
 */
export function resetRoutingMetrics(): void {
  metrics = {
    totalRequests: 0,
    localRequests: 0,
    externalRequests: 0,
    localPercentage: 0,
    totalCost: 0,
    savedCost: 0,
  };
}

/**
 * BRAND CONSISTENCY CHECK (Local)
 * Uses OpenCLIP to validate brand consistency
 */
export async function checkBrandConsistency(
  imageOrText: string,
  brandReferencePath: string
): Promise<{ isConsistent: boolean; similarity: number; reason: string }> {
  // This would integrate with actual OpenCLIP model
  // For now, return mock implementation
  
  const project = getCurrentProject();
  const threshold = project?.name === 'aurafx' ? 0.90 : 0.85;
  
  logAudit({
    project: project?.name || 'unknown',
    action: 'brand_check',
    success: true,
    metadata: { threshold },
  });

  // TODO: Implement actual OpenCLIP integration
  const mockSimilarity = 0.88;
  
  return {
    isConsistent: mockSimilarity >= threshold,
    similarity: mockSimilarity,
    reason: `Brand similarity score: ${mockSimilarity.toFixed(2)} (threshold: ${threshold})`,
  };
}

/**
 * TOXICITY CHECK (Local)
 * Uses local toxicity model to filter unsafe content
 */
export async function checkToxicity(
  text: string
): Promise<{ isSafe: boolean; toxicityScore: number; reason: string }> {
  // This would integrate with actual toxic-bert model
  // For now, return mock implementation
  
  const project = getCurrentProject();
  const threshold = project?.name === 'aurafx' ? 0.60 : 0.70;
  
  logAudit({
    project: project?.name || 'unknown',
    action: 'toxicity_check',
    success: true,
    metadata: { threshold },
  });

  // TODO: Implement actual toxicity model integration
  const mockToxicityScore = 0.15;
  
  return {
    isSafe: mockToxicityScore < threshold,
    toxicityScore: mockToxicityScore,
    reason: `Toxicity score: ${mockToxicityScore.toFixed(2)} (threshold: ${threshold})`,
  };
}

/**
 * EXECUTE WITH PIPELINE
 * Runs full pipeline with brand/safety checks
 */
export async function executeWithPipeline(request: RoutingRequest): Promise<{
  response: string;
  routing: RoutingDecision;
  brandCheck?: any;
  safetyCheck?: any;
}> {
  // Step 1: Route request
  const routing = await route(request);

  // Step 2: Safety check (if enabled)
  let safetyCheck;
  if (process.env.ENABLE_TOXICITY_FILTER === 'true') {
    safetyCheck = await checkToxicity(request.input);
    if (!safetyCheck.isSafe) {
      throw new Error(`Content rejected: ${safetyCheck.reason}`);
    }
  }

  // Step 3: Execute model call (placeholder)
  const response = await executeModelCall(routing, request.input);

  // Step 4: Brand check (if required)
  let brandCheck;
  if (request.requiresBrand && process.env.ENABLE_BRAND_CHECK === 'true') {
    const brandPath = process.env.BRAND_REFERENCE_IMAGES_PATH || '/app/brand';
    brandCheck = await checkBrandConsistency(response, brandPath);
  }

  return {
    response,
    routing,
    brandCheck,
    safetyCheck,
  };
}

/**
 * EXECUTE MODEL CALL (Placeholder)
 * TODO: Implement actual model API calls
 */
async function executeModelCall(routing: RoutingDecision, input: string): Promise<string> {
  console.log(`🤖 Executing ${routing.provider} (${routing.model})`);
  console.log(`   Cost: $${routing.estimatedCost.toFixed(4)} | Local: ${routing.isLocal}`);
  
  // In production, this would call actual model APIs
  return `Response from ${routing.model}: Processed "${input.substring(0, 50)}..."`;
}
