/**
 * ============================================================
 * INTEGRATION WITH EXISTING AGENT SYSTEM
 * ============================================================
 * Wraps existing BaseAgent with cost-optimized routing.
 * 
 * HUMAN-IN-COMMAND: All invocations require explicit confirmation.
 */

import { BaseAgent } from '../agents/base/agent';
import { AgentRequest, AgentResponse, InvocationOptions, createAgentConfirmationGate } from '../agents/base/types';
import { executeTask } from './router';
import { AITask, ConfirmationGate, createConfirmationGate } from './types';
import { getTemplate } from './templates';

/**
 * OPTIMIZED AGENT WRAPPER
 * Wraps BaseAgent with intelligent routing
 */
export class OptimizedAgent {
  private agent: BaseAgent;

  constructor(agent: BaseAgent) {
    this.agent = agent;
  }

  /**
   * INVOKE WITH ROUTING
   * Uses AI router instead of direct Claude call.
   * 
   * HUMAN-IN-COMMAND: Requires explicit invocation options with confirmation.
   */
  async invoke(request: AgentRequest, options: InvocationOptions): Promise<AgentResponse> {
    // Detect if this is a simple or complex task
    const complexity = this.estimateComplexity(request);
    
    // For simple tasks (< 0.5 complexity), use Mistral
    // For complex tasks, use existing Claude integration
    if (complexity < 0.5) {
      return this.invokeOptimized(request, options);
    } else {
      // Use existing agent (Claude) for complex tasks
      return this.agent.invoke(request, options);
    }
  }

  /**
   * INVOKE OPTIMIZED
   * Routes through cost-optimized pipeline.
   * 
   * HUMAN-IN-COMMAND: Uses confirmation from InvocationOptions.
   */
  private async invokeOptimized(request: AgentRequest, options: InvocationOptions): Promise<AgentResponse> {
    // Create AI confirmation gate from agent confirmation
    const aiConfirmation: ConfirmationGate = {
      confirmed: options.confirmation.confirmed,
      confirmationToken: options.confirmation.confirmationToken,
      confirmedAt: options.confirmation.confirmedAt,
      confirmedAction: `Optimized agent task: ${request.message.substring(0, 50)}...`,
    };

    // Build AI task
    const task: AITask = {
      type: 'generation',
      input: request.message,
      systemPrompt: this.agent['config'].systemPrompt,
      contextHistory: request.history?.map(m => m.content) || [],
      isClientFacing: true, // Assume all agent responses are client-facing
      maxBudget: 0.05, // $0.05 max for simple tasks
      confirmation: aiConfirmation, // HUMAN-IN-COMMAND: Pass through confirmation
    };

    try {
      // Execute through router
      const response = await executeTask(task);

      // Convert to AgentResponse format
      return {
        answer: response,
        confidence: 0.8,
        sources: [],
        reasoning: 'Optimized routing via Mistral',
        metadata: {
          optimized: true,
          model: 'mistral',
        },
      };
    } catch (error) {
      console.error('❌ Optimized routing failed, falling back to Claude:', error);
      // Fallback to original agent
      return this.agent.invoke(request, options);
    }
  }

  /**
   * ESTIMATE COMPLEXITY
   */
  private estimateComplexity(request: AgentRequest): number {
    const length = request.message.length;
    const hasHistory = (request.history?.length || 0) > 2;
    const hasContext = request.context !== undefined;

    let complexity = 0;

    // Length factor
    if (length > 1000) complexity += 0.3;
    else if (length > 500) complexity += 0.2;
    else complexity += 0.1;

    // History factor
    if (hasHistory) complexity += 0.2;

    // Context factor
    if (hasContext) complexity += 0.2;

    return Math.min(complexity, 1.0);
  }
}

/**
 * WRAP EXISTING AGENT
 * Helper to wrap any BaseAgent with optimization
 */
export function wrapAgent(agent: BaseAgent): OptimizedAgent {
  return new OptimizedAgent(agent);
}

/**
 * TEMPLATE-BASED GENERATION
 * Generate content using predefined templates.
 * 
 * HUMAN-IN-COMMAND: Requires explicit confirmation gate.
 */
export async function generateFromTemplate(
  templateId: string,
  input: string,
  confirmation: ConfirmationGate,
  variables?: Record<string, string>
): Promise<string> {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Replace variables in input
  let processedInput = input;
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      processedInput = processedInput.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
  }

  // Build task
  const task: AITask = {
    type: 'generation',
    input: processedInput,
    systemPrompt: template.systemPrompt,
    isClientFacing: template.isClientFacing,
    requiresReasoning: template.complexity > 0.7,
    confirmation, // HUMAN-IN-COMMAND: Require confirmation
  };

  // Execute
  return executeTask(task);
}

/**
 * BATCH AGENT RESPONSES
 * Process multiple agent requests efficiently.
 * 
 * HUMAN-IN-COMMAND: Each request requires confirmation.
 */
export async function batchAgentResponses(
  agent: BaseAgent,
  requests: AgentRequest[],
  options: InvocationOptions
): Promise<AgentResponse[]> {
  const optimizedAgent = wrapAgent(agent);
  
  const responses: AgentResponse[] = [];
  for (const request of requests) {
    const response = await optimizedAgent.invoke(request, options);
    responses.push(response);
  }
  
  return responses;
}

/**
 * SMART AGENT SELECTOR
 * Selects the most cost-effective agent based on request
 */
export function selectAgent(
  request: AgentRequest,
  availableAgents: BaseAgent[]
): BaseAgent {
  // Simple selection based on message content
  // In production, this would be more sophisticated
  
  // For now, return first agent
  return availableAgents[0];
}
