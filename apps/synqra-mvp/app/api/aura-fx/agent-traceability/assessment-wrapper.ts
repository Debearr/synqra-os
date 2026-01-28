/**
 * Assessment Generation Wrapper with Agent Traceability
 * Wraps assessment generation to automatically log agent metadata
 */

import {
  TraceabilityService,
  createAgentIdentity,
  createPromptSnapshot,
  createReasoningStep,
  createContextSnapshot,
} from "./traceability-service";
import type {
  AgentIdentity,
  ReasoningStep,
  ContextSnapshot,
} from "./types";

/**
 * Assessment generation context
 */
export interface AssessmentContext {
  assessmentId: string;
  symbol: string;
  timeframe: string;
  dataPoints: number;
  timestampRange: {
    start: string;
    end: string;
  };
  indicatorsUsed: string[];
  externalDataSources: string[];
}

/**
 * Agent execution metadata
 */
export interface AgentExecutionMetadata {
  agents: AgentIdentity[];
  primaryAgent: AgentIdentity;
  reasoningSteps: ReasoningStep[];
  totalTokens: number;
  modelUsed: string;
  temperature: number;
}

/**
 * Prompt metadata
 */
export interface PromptMetadata {
  templateName: string;
  templateContent: string;
  parameters: Record<string, unknown>;
}

/**
 * Wrapper for assessment generation with automatic traceability
 */
export class AssessmentWithTraceability<T> {
  private traceabilityService: TraceabilityService;
  private assessmentSchemaVersion: string;

  constructor(
    assessmentSchemaVersion: string = "1.0.0",
    authToken?: string
  ) {
    this.traceabilityService = new TraceabilityService(authToken);
    this.assessmentSchemaVersion = assessmentSchemaVersion;
  }

  /**
   * Execute assessment with automatic traceability logging
   * 
   * @param assessmentFn - Function that generates the assessment
   * @param context - Assessment context (symbol, timeframe, etc.)
   * @param agentMetadata - Agent execution metadata
   * @param promptMetadata - Prompt metadata
   * @returns Assessment result
   */
  async execute(
    assessmentFn: () => Promise<T>,
    context: AssessmentContext,
    agentMetadata: AgentExecutionMetadata,
    promptMetadata: PromptMetadata
  ): Promise<T> {
    // Execute assessment
    const result = await assessmentFn();

    // Create context snapshot
    const contextSnapshot = createContextSnapshot(
      context.symbol,
      context.timeframe,
      context.dataPoints,
      context.timestampRange,
      context.indicatorsUsed,
      context.externalDataSources
    );

    // Create prompt snapshot
    const promptSnapshot = createPromptSnapshot(
      promptMetadata.templateContent,
      promptMetadata.templateName,
      promptMetadata.parameters
    );

    // Log traceability record (fire-and-forget, don't block response)
    this.logTraceability(
      context.assessmentId,
      agentMetadata,
      promptSnapshot,
      contextSnapshot
    ).catch((error) => {
      console.error("Failed to log traceability record:", error);
      // Don't throw - traceability logging should not block assessment
    });

    return result;
  }

  /**
   * Log traceability record
   */
  private async logTraceability(
    assessmentId: string,
    agentMetadata: AgentExecutionMetadata,
    promptSnapshot: any,
    contextSnapshot: ContextSnapshot
  ): Promise<void> {
    await this.traceabilityService.createTraceabilityRecord(
      assessmentId,
      this.assessmentSchemaVersion,
      agentMetadata.agents,
      agentMetadata.primaryAgent,
      promptSnapshot,
      agentMetadata.reasoningSteps,
      contextSnapshot,
      agentMetadata.totalTokens,
      agentMetadata.modelUsed,
      agentMetadata.temperature
    );
  }
}

/**
 * Example usage for AuraFX signal generation
 */
export async function generateAuraFxSignalWithTraceability(
  signal: any,
  candles: any[],
  symbol: string,
  timeframe: string
): Promise<any> {
  // Create wrapper
  const wrapper = new AssessmentWithTraceability("1.0.0");

  // Define agents involved
  const agents: AgentIdentity[] = [
    createAgentIdentity("aura-fx-analyzer", "1.0.0", "analyzer"),
    createAgentIdentity("signal-generator", "1.0.0", "signal_generator"),
  ];

  const primaryAgent = agents[0];

  // Create reasoning steps
  const reasoningSteps: ReasoningStep[] = [
    createReasoningStep(
      1,
      "aura-fx-analyzer",
      "analyze_market_structure",
      { candles_count: candles.length, symbol, timeframe },
      { trend: signal.trend, confluence: signal.confluence },
      "Analyzed market structure using technical indicators and trend analysis"
    ),
    createReasoningStep(
      2,
      "signal-generator",
      "generate_signal",
      { direction: signal.direction, probability: signal.probability },
      { signal_id: signal.id, entry: signal.entry, stop: signal.stop },
      "Generated directional assessment based on confluence analysis"
    ),
  ];

  // Create context
  const context: AssessmentContext = {
    assessmentId: signal.id || crypto.randomUUID(),
    symbol,
    timeframe,
    dataPoints: candles.length,
    timestampRange: {
      start: candles[0]?.timestamp || new Date().toISOString(),
      end: candles[candles.length - 1]?.timestamp || new Date().toISOString(),
    },
    indicatorsUsed: ["EMA", "RSI", "MACD", "Support/Resistance"],
    externalDataSources: ["Market Data API"],
  };

  // Create agent metadata
  const agentMetadata: AgentExecutionMetadata = {
    agents,
    primaryAgent,
    reasoningSteps,
    totalTokens: 0, // No LLM used in current implementation
    modelUsed: "rule-based-v1",
    temperature: 0,
  };

  // Create prompt metadata (for rule-based system)
  const promptMetadata: PromptMetadata = {
    templateName: "aura-fx-confluence-analysis",
    templateContent: "Rule-based confluence analysis using technical indicators",
    parameters: {
      symbol,
      timeframe,
      indicators: context.indicatorsUsed,
    },
  };

  // Execute with traceability
  return wrapper.execute(
    async () => signal,
    context,
    agentMetadata,
    promptMetadata
  );
}

/**
 * Helper to create reasoning step from agent action
 */
export function logAgentAction(
  stepNumber: number,
  agentName: string,
  action: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  reasoning: string
): ReasoningStep {
  return createReasoningStep(
    stepNumber,
    agentName,
    action,
    input,
    output,
    reasoning
  );
}
