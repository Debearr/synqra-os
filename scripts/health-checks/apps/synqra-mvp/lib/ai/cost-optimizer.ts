/**
 * ============================================================
 * SYNQRA COST OPTIMIZER
 * ============================================================
 * Intelligent cost reduction without quality compromise
 */

import { AITask, ModelProvider } from './types';
import { estimateCost, estimateTokens } from './cost';

/**
 * COST OPTIMIZATION DECISION
 */
export interface CostDecision {
  originalModel: ModelProvider;
  selectedModel: ModelProvider;
  reason: string;
  estimatedSavings: number;
  batchingApplied: boolean;
  cacheHit: boolean;
}

/**
 * TASK CLASSIFICATION
 */
export type TaskClass = 'creative' | 'structural' | 'visual';

/**
 * CLASSIFY TASK FOR COST ROUTING
 */
export function classifyTask(task: AITask): TaskClass {
  const input = task.input.toLowerCase();
  const type = task.type;
  
  // Visual generation tasks
  if (
    input.includes('image') ||
    input.includes('visual') ||
    input.includes('photo') ||
    input.includes('archetype') ||
    input.includes('lifestyle model')
  ) {
    return 'visual';
  }
  
  // Structural tasks (use cheap models)
  if (
    type === 'classification' ||
    input.includes('json') ||
    input.includes('schema') ||
    input.includes('format') ||
    input.includes('list') ||
    input.includes('preset') ||
    input.includes('migration') ||
    input.includes('structure')
  ) {
    return 'structural';
  }
  
  // Creative tasks (may need premium)
  return 'creative';
}

/**
 * OPTIMIZE MODEL SELECTION
 */
export function optimizeModelSelection(
  task: AITask,
  originalModel?: ModelProvider
): CostDecision {
  const taskClass = classifyTask(task);
  const inputTokens = estimateTokens(task.input);
  
  let selectedModel: ModelProvider;
  let reason: string;
  let estimatedSavings = 0;
  
  // Get original model or default
  const original = originalModel || task.model || 'claude';
  
  // Optimize based on task class
  switch (taskClass) {
    case 'structural':
      selectedModel = 'deepseek';
      reason = 'Structural task → DeepSeek (70% cheaper)';
      
      if (original === 'claude') {
        const claudeCost = estimateCost('claude', { input: inputTokens, output: inputTokens * 0.5 });
        const deepseekCost = estimateCost('deepseek', { input: inputTokens, output: inputTokens * 0.5 });
        estimatedSavings = claudeCost - deepseekCost;
      }
      break;
      
    case 'visual':
      selectedModel = 'mistral';
      reason = 'Visual prompt generation → Mistral (compact prompts)';
      
      if (original === 'claude') {
        const claudeCost = estimateCost('claude', { input: inputTokens, output: inputTokens * 0.3 });
        const mistralCost = estimateCost('mistral', { input: inputTokens, output: inputTokens * 0.3 });
        estimatedSavings = claudeCost - mistralCost;
      }
      break;
      
    case 'creative':
      // Check complexity
      if (inputTokens > 1000 || task.requiresReasoning) {
        selectedModel = 'claude';
        reason = 'High-complexity creative → Claude (quality required)';
      } else {
        selectedModel = 'deepseek';
        reason = 'Moderate creative → DeepSeek (sufficient quality)';
        
        if (original === 'claude') {
          const claudeCost = estimateCost('claude', { input: inputTokens, output: inputTokens * 0.6 });
          const deepseekCost = estimateCost('deepseek', { input: inputTokens, output: inputTokens * 0.6 });
          estimatedSavings = claudeCost - deepseekCost;
        }
      }
      break;
  }
  
  return {
    originalModel: original,
    selectedModel,
    reason,
    estimatedSavings,
    batchingApplied: false,
    cacheHit: false,
  };
}

/**
 * COMPRESS INPUT FOR COST OPTIMIZER
 * Reduces verbose input to compact variables
 */
export function compressInputForCostOptimizer(input: string): string {
  // Remove filler phrases
  const fillers = [
    'I want you to',
    'Please generate',
    'Can you create',
    'I need',
    'We would like',
    'The goal is to',
    'Our objective is',
    'basically',
    'actually',
    'really',
    'very',
  ];
  
  let compressed = input;
  for (const filler of fillers) {
    const regex = new RegExp(filler, 'gi');
    compressed = compressed.replace(regex, '');
  }
  
  // Trim whitespace
  compressed = compressed.replace(/\s+/g, ' ').trim();
  
  return compressed;
}

/**
 * DETECT BATCHABLE TASKS
 */
export function detectBatchableTasks(tasks: AITask[]): AITask[][] {
  const batches: AITask[][] = [];
  const batchMap = new Map<string, AITask[]>();
  
  for (const task of tasks) {
    // Group by type and similar input length
    const key = `${task.type}-${Math.floor(task.input.length / 500)}`;
    
    if (!batchMap.has(key)) {
      batchMap.set(key, []);
    }
    batchMap.get(key)!.push(task);
  }
  
  // Convert to array of batches
  for (const [_, batch] of batchMap.entries()) {
    if (batch.length > 1) {
      batches.push(batch);
    }
  }
  
  return batches;
}

/**
 * GENERATE COST REPORT
 */
export function generateCostReport(decision: CostDecision): string {
  return `💰 Cost Decision
Model: ${decision.selectedModel}
Reason: ${decision.reason}
Savings: $${decision.estimatedSavings.toFixed(4)}
Batching: ${decision.batchingApplied ? 'Yes' : 'No'}
Cache: ${decision.cacheHit ? 'Yes' : 'No'}`;
}

/**
 * BRAND PROFILE CACHE KEY
 */
export function getBrandProfileCacheKey(brandName: string): string {
  return `brand-profile:${brandName.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * ARCHETYPE CACHE KEY
 */
export function getArchetypeCacheKey(archetypeName: string): string {
  return `archetype:${archetypeName.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * CHECK IF TASK IS WASTEFUL
 */
export function detectWaste(task: AITask): {
  isWasteful: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  const inputTokens = estimateTokens(task.input);
  
  // Check for excessive length
  if (inputTokens > 2000) {
    issues.push('Input exceeds 2000 tokens');
    suggestions.push('Use variable injection instead of full descriptions');
  }
  
  // Check for repetition
  const words = task.input.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRate = 1 - (uniqueWords.size / words.length);
  
  if (repetitionRate > 0.3) {
    issues.push(`High repetition (${(repetitionRate * 100).toFixed(0)}%)`);
    suggestions.push('Remove redundant text, use references');
  }
  
  // Check for verbose phrases
  const verbosePhrases = [
    'in order to',
    'for the purpose of',
    'with the goal of',
    'we want to make sure',
    'it is important that',
  ];
  
  let verboseCount = 0;
  for (const phrase of verbosePhrases) {
    if (task.input.toLowerCase().includes(phrase)) {
      verboseCount++;
    }
  }
  
  if (verboseCount > 2) {
    issues.push('Contains verbose corporate language');
    suggestions.push('Use direct, concise language');
  }
  
  const isWasteful = issues.length > 0;
  
  return { isWasteful, issues, suggestions };
}

/**
 * AUTO-APPLY MINIMAL MODE
 */
export function applyMinimalMode(task: AITask): AITask {
  const waste = detectWaste(task);
  
  if (!waste.isWasteful) {
    return task;
  }
  
  console.warn('⚠️ Wasteful task detected, applying minimal mode');
  console.warn('Issues:', waste.issues);
  console.warn('Suggestions:', waste.suggestions);
  
  // Compress input
  const compressedInput = compressInputForCostOptimizer(task.input);
  
  // Add minimal mode instruction
  const minimalInstruction = `
[MINIMAL OUTPUT MODE]
- Core sections only
- Skip fluff
- Compact format
- User can request details later
`;
  
  return {
    ...task,
    input: compressedInput,
    systemPrompt: (task.systemPrompt || '') + minimalInstruction,
  };
}

/**
 * COST OPTIMIZATION SUMMARY
 */
export interface OptimizationSummary {
  originalCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  decisionsApplied: string[];
}

/**
 * CALCULATE OPTIMIZATION SUMMARY
 */
export function calculateOptimizationSummary(
  originalTask: AITask,
  optimizedTask: AITask,
  decision: CostDecision
): OptimizationSummary {
  const originalTokens = {
    input: estimateTokens(originalTask.input),
    output: estimateTokens(originalTask.input) * 0.5,
  };
  
  const optimizedTokens = {
    input: estimateTokens(optimizedTask.input),
    output: estimateTokens(optimizedTask.input) * 0.5,
  };
  
  const originalCost = estimateCost(decision.originalModel, originalTokens);
  const optimizedCost = estimateCost(decision.selectedModel, optimizedTokens);
  const savings = originalCost - optimizedCost;
  const savingsPercent = (savings / originalCost) * 100;
  
  const decisionsApplied: string[] = [];
  if (decision.selectedModel !== decision.originalModel) {
    decisionsApplied.push(`Model downgrade: ${decision.originalModel} → ${decision.selectedModel}`);
  }
  if (optimizedTokens.input < originalTokens.input) {
    decisionsApplied.push(`Input compression: ${originalTokens.input} → ${optimizedTokens.input} tokens`);
  }
  if (decision.batchingApplied) {
    decisionsApplied.push('Batching applied');
  }
  if (decision.cacheHit) {
    decisionsApplied.push('Cache hit');
  }
  
  return {
    originalCost,
    optimizedCost,
    savings,
    savingsPercent,
    decisionsApplied,
  };
}
