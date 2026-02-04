/**
 * ============================================================
 * HYBRID AGENT - LOCAL + API INTEGRATION
 * ============================================================
 * Integrates HuggingFace local models with existing agent system
 * Routes intelligently between local and API models
 * Validates quality and escalates when needed
 * 
 * HUMAN-IN-COMMAND: All hybrid requests require explicit confirmation.
 */

import { AgentRequest, AgentResponse, InvocationOptions, validateAgentConfirmation } from "../agents/base/types";
import { routeToModel, trackRouting, shouldEscalate } from "./intelligentRouter";
import { runInference } from "./localModelLoader";
import { validateQuality } from "./qualityValidator";
import { logLearningData } from "./selfLearning";
import { getModelConfig } from "./modelRegistry";
import { checkBudget, recordCost } from "../agents/budgetGuardrails";

/**
 * Process request using hybrid local+API approach
 * 
 * HUMAN-IN-COMMAND: Requires explicit confirmation gate in options.
 */
export async function processHybridRequest(
  request: AgentRequest,
  options: InvocationOptions
): Promise<AgentResponse> {
  // CONFIRMATION GATE: Enforce human confirmation before any hybrid AI processing
  validateAgentConfirmation(
    options.confirmation,
    `Hybrid AI request: ${request.message.substring(0, 50)}...`
  );
  const startTime = Date.now();
  
  console.log(`🔄 Processing hybrid request: "${request.message.substring(0, 50)}..."`);
  
  // Step 1: Route to optimal model
  const routing = routeToModel(request.message, {
    preferLocal: true,
    maxCostPerRequest: 0.02,
    maxLatencyMs: 3000,
    brandConsistencyRequired: options.metadata?.requiresBrand || false,
  });
  
  console.log(`   📍 Routed to: ${routing.selectedModel} (${routing.complexity})`);
  console.log(`   💡 Reason: ${routing.reason}`);
  
  trackRouting(routing);
  
  // Step 2: Check budget before proceeding
  const budgetCheck = await checkBudget(routing.estimatedCost);
  if (!budgetCheck.allowed) {
    console.error(`   🚫 Budget check failed: ${budgetCheck.reason}`);
    
    return {
      answer: `I apologize, but I cannot process this request due to budget constraints. ${budgetCheck.reason}`,
      confidence: 0,
      sources: [],
      reasoning: "Budget guardrail blocked request",
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0,
        estimatedCost: 0,
      },
      metadata: {
        budgetBlocked: true,
        routingDecision: routing,
      },
    };
  }
  
  // Step 3: Attempt inference with primary model
  let response: AgentResponse;
  let attempt = 1;
  let currentModel = routing.selectedModel;
  
  while (attempt <= 3) {
    try {
      console.log(`   🤖 Attempt ${attempt}: Using ${currentModel}`);
      
      // Run inference
      const inferenceResult = await runInference({
        modelId: currentModel,
        input: request.message,
        options: {
          maxTokens: options.responseTier === "quick" ? 300 : 
                     options.responseTier === "detailed" ? 1024 : 600,
          temperature: 0.7,
        },
      });
      
      // Build initial response
      response = {
        answer: String(inferenceResult.output),
        confidence: inferenceResult.confidence,
        sources: [],
        reasoning: `Response from ${currentModel} via ${routing.complexity} routing`,
        tokenUsage: {
          input: 0, // Would need to calculate
          output: 0,
          total: 0,
          estimatedCost: inferenceResult.cost,
        },
        metadata: {
          modelUsed: currentModel,
          routingDecision: routing,
          attempt,
          latencyMs: inferenceResult.latencyMs,
        },
      };
      
      // Step 4: Validate quality
      const validation = await validateQuality(
        request.message,
        response.answer,
        currentModel,
        {
          requiresBrand: options.metadata?.requiresBrand,
        }
      );
      
      console.log(`   ✅ Quality score: ${(validation.score * 100).toFixed(1)}%`);
      console.log(`   📊 Action: ${validation.action}`);
      
      if (validation.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${validation.issues.join(", ")}`);
      }
      
      // Step 5: Determine if escalation needed
      if (validation.action === "deliver") {
        // Quality acceptable - deliver response
        console.log(`   ✅ Response accepted, delivering`);
        
        // Record cost and log learning data
        await recordCost(inferenceResult.cost);
        logLearningData({
          input: request.message,
          modelUsed: currentModel,
          outputQuality: validation.score,
          userFeedback: undefined,
          brandConsistency: undefined,
          toxicityScore: undefined,
          routingDecision: routing.reason,
          costEfficiency: inferenceResult.cost === 0 ? 1.0 : 0.5,
          timestamp: Date.now(),
        });
        
        return response;
      } else if (validation.action === "rephrase" && attempt < 3) {
        // Try rephrasing with same model
        console.log(`   🔄 Rephrasing attempt ${attempt + 1}`);
        
        // Add rephrase instruction
        request.message = `${request.message}\n\nPlease rephrase focusing on: ${validation.suggestions?.join(", ")}`;
        attempt++;
        continue;
      } else if (validation.action === "escalate") {
        // Escalate to better model
        const escalation = shouldEscalate(validation.score, currentModel, attempt);
        
        if (escalation.escalate && escalation.nextModel) {
          console.log(`   ⬆️  Escalating to ${escalation.nextModel}`);
          console.log(`   💡 Reason: ${escalation.reason}`);
          
          currentModel = escalation.nextModel;
          attempt++;
          continue;
        } else {
          // No more escalation options, deliver what we have
          console.log(`   ⚠️  No escalation options, delivering current response`);
          
          await recordCost(inferenceResult.cost);
          logLearningData({
            input: request.message,
            modelUsed: currentModel,
            outputQuality: validation.score,
            userFeedback: -1, // Mark as suboptimal
            routingDecision: routing.reason,
            costEfficiency: inferenceResult.cost === 0 ? 0.7 : 0.4,
            timestamp: Date.now(),
          });
          
          return response;
        }
      }
    } catch (error) {
      console.error(`   ❌ Inference failed on attempt ${attempt}:`, error);
      
      // Try fallback model
      if (attempt < routing.fallbackModels.length + 1) {
        currentModel = routing.fallbackModels[attempt - 1];
        console.log(`   🔄 Falling back to ${currentModel}`);
        attempt++;
        continue;
      } else {
        throw error;
      }
    }
  }
  
  // Should never reach here, but return error response if we do
  return {
    answer: "I apologize, but I encountered an error processing your request. Please try again.",
    confidence: 0,
    sources: [],
    reasoning: "All inference attempts failed",
    tokenUsage: {
      input: 0,
      output: 0,
      total: 0,
      estimatedCost: 0,
    },
    metadata: {
      error: true,
      attempts: attempt,
    },
  };
}

/**
 * Batch process multiple requests (more efficient)
 * 
 * HUMAN-IN-COMMAND: Requires explicit confirmation gate in options.
 */
export async function processBatchHybrid(
  requests: AgentRequest[],
  options: InvocationOptions
): Promise<AgentResponse[]> {
  // CONFIRMATION GATE: Validate before batch processing
  validateAgentConfirmation(
    options.confirmation,
    `Batch hybrid AI processing: ${requests.length} requests`
  );
  
  console.log(`📦 Batch processing ${requests.length} requests`);
  
  // Process all in parallel
  const responses = await Promise.all(
    requests.map(request => processHybridRequest(request, options))
  );
  
  console.log(`✅ Batch complete: ${responses.length} responses`);
  
  return responses;
}

/**
 * Get hybrid system status
 */
export function getHybridSystemStatus(): {
  localModelsAvailable: boolean;
  apiModelsAvailable: boolean;
  recommendedMode: "local-primary" | "api-primary" | "balanced";
  costSavings: number;
} {
  // Check which models are available
  const localAvailable = true; // Would check actual model availability
  const apiAvailable = true; // Always true (fallback)
  
  // Recommend mode based on budget and performance
  const budgetUsage = 0.5; // Would get from budget system
  const localPerformance = 0.8; // Would get from learning system
  
  let recommendedMode: "local-primary" | "api-primary" | "balanced";
  if (budgetUsage > 0.8) {
    recommendedMode = "local-primary";
  } else if (localPerformance < 0.6) {
    recommendedMode = "api-primary";
  } else {
    recommendedMode = "balanced";
  }
  
  return {
    localModelsAvailable: localAvailable,
    apiModelsAvailable: apiAvailable,
    recommendedMode,
    costSavings: 0.75, // 75% savings
  };
}
