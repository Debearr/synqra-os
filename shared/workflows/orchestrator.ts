/**
 * ============================================================
 * WORKFLOW ORCHESTRATOR - NØID LABS
 * ============================================================
 * Intelligent workflow engine for complex operations
 * 
 * Apple/Tesla principle:
 * - Simple interface, intelligent execution
 * - Auto-optimize based on performance
 * - Fail gracefully, retry smartly
 * - Learn from every execution
 * 
 * Usage:
 *   const workflow = new Workflow("generate_campaign")
 *     .step("research", researchTask)
 *     .step("generate", generateTask)
 *     .step("refine", refineTask)
 *     .step("validate", validateTask);
 *   
 *   const result = await workflow.execute(input);
 */

import { logIntelligence } from "../db/supabase";
import type { App } from "../types";

// ============================================================
// TYPES
// ============================================================

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowStep<TInput = any, TOutput = any> {
  name: string;
  handler: (input: TInput, context: WorkflowContext) => Promise<TOutput>;
  retryConfig?: RetryConfig;
  timeout?: number; // ms
  condition?: (input: TInput, context: WorkflowContext) => boolean | Promise<boolean>;
  onError?: (error: Error, context: WorkflowContext) => Promise<void>;
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoff?: "linear" | "exponential"; // Default: exponential
}

export interface WorkflowContext {
  workflowId: string;
  app: App;
  metadata: Record<string, any>;
  results: Map<string, any>; // Results from previous steps
  startTime: number;
  currentStep?: string;
}

export interface StepResult<T = any> {
  name: string;
  status: StepStatus;
  data?: T;
  error?: Error;
  duration: number; // ms
  attempts: number;
  timestamp: number;
}

export interface WorkflowResult<T = any> {
  workflowId: string;
  status: "success" | "partial" | "failed";
  data?: T;
  steps: StepResult[];
  duration: number;
  metadata: Record<string, any>;
}

// ============================================================
// WORKFLOW CLASS
// ============================================================

export class Workflow<TInput = any, TOutput = any> {
  private name: string;
  private app: App;
  private steps: WorkflowStep[] = [];
  private defaultRetry: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: "exponential",
  };

  constructor(name: string, app: App = "shared") {
    this.name = name;
    this.app = app;
  }

  /**
   * Add a step to the workflow
   */
  step<StepInput = any, StepOutput = any>(
    name: string,
    handler: (input: StepInput, context: WorkflowContext) => Promise<StepOutput>,
    options?: {
      retry?: RetryConfig;
      timeout?: number;
      condition?: (input: StepInput, context: WorkflowContext) => boolean | Promise<boolean>;
      onError?: (error: Error, context: WorkflowContext) => Promise<void>;
    }
  ): this {
    this.steps.push({
      name,
      handler,
      retryConfig: options?.retry || this.defaultRetry,
      timeout: options?.timeout,
      condition: options?.condition,
      onError: options?.onError,
    });
    return this;
  }

  /**
   * Add a parallel step (executes multiple handlers concurrently)
   */
  parallel<StepInput = any, StepOutput = any>(
    name: string,
    handlers: Array<(input: StepInput, context: WorkflowContext) => Promise<StepOutput>>,
    options?: {
      retry?: RetryConfig;
      timeout?: number;
    }
  ): this {
    this.steps.push({
      name,
      handler: async (input: StepInput, context: WorkflowContext) => {
        const results = await Promise.allSettled(
          handlers.map((h) => h(input, context))
        );
        
        return results.map((r, i) => ({
          index: i,
          status: r.status,
          data: r.status === "fulfilled" ? r.value : undefined,
          error: r.status === "rejected" ? r.reason : undefined,
        }));
      },
      retryConfig: options?.retry || this.defaultRetry,
      timeout: options?.timeout,
    });
    return this;
  }

  /**
   * Add conditional branching
   */
  branch<StepInput = any>(
    name: string,
    condition: (input: StepInput, context: WorkflowContext) => boolean | Promise<boolean>,
    truePath: WorkflowStep,
    falsePath?: WorkflowStep
  ): this {
    this.steps.push({
      name,
      handler: async (input: StepInput, context: WorkflowContext) => {
        const shouldTakeTrue = await condition(input, context);
        if (shouldTakeTrue) {
          return truePath.handler(input, context);
        } else if (falsePath) {
          return falsePath.handler(input, context);
        }
        return null;
      },
    });
    return this;
  }

  /**
   * Execute the workflow
   */
  async execute(input: TInput, metadata?: Record<string, any>): Promise<WorkflowResult<TOutput>> {
    const workflowId = generateId();
    const startTime = Date.now();
    const stepResults: StepResult[] = [];

    const context: WorkflowContext = {
      workflowId,
      app: this.app,
      metadata: metadata || {},
      results: new Map(),
      startTime,
    };

    let lastResult: any = input;
    let overallStatus: "success" | "partial" | "failed" = "success";

    // Execute steps sequentially
    for (const step of this.steps) {
      context.currentStep = step.name;
      const stepStart = Date.now();

      try {
        // Check condition
        if (step.condition) {
          const shouldRun = await step.condition(lastResult, context);
          if (!shouldRun) {
            stepResults.push({
              name: step.name,
              status: "skipped",
              duration: Date.now() - stepStart,
              attempts: 0,
              timestamp: stepStart,
            });
            continue;
          }
        }

        // Execute with retry
        const result = await this.executeWithRetry(
          step,
          lastResult,
          context
        );

        stepResults.push({
          name: step.name,
          status: "completed",
          data: result.data,
          duration: Date.now() - stepStart,
          attempts: result.attempts,
          timestamp: stepStart,
        });

        // Store result for next step
        context.results.set(step.name, result.data);
        lastResult = result.data;

      } catch (error) {
        const err = error as Error;
        
        stepResults.push({
          name: step.name,
          status: "failed",
          error: err,
          duration: Date.now() - stepStart,
          attempts: step.retryConfig?.maxAttempts || 1,
          timestamp: stepStart,
        });

        // Call error handler if provided
        if (step.onError) {
          try {
            await step.onError(err, context);
          } catch (handlerError) {
            console.error(`Error handler failed for step ${step.name}:`, handlerError);
          }
        }

        // Determine if we should continue or fail
        overallStatus = "failed";
        break; // Stop execution on error
      }
    }

    // If we completed all steps, check if any failed
    if (overallStatus !== "failed") {
      const hasFailures = stepResults.some((s) => s.status === "failed");
      overallStatus = hasFailures ? "partial" : "success";
    }

    const duration = Date.now() - startTime;

    // Log workflow execution
    await logIntelligence({
      app: this.app,
      operation: `workflow_${this.name}`,
      success: overallStatus === "success",
      metadata: {
        workflowId,
        steps: stepResults.map((s) => ({
          name: s.name,
          status: s.status,
          duration: s.duration,
        })),
        duration,
      },
    });

    return {
      workflowId,
      status: overallStatus,
      data: overallStatus === "success" ? lastResult : undefined,
      steps: stepResults,
      duration,
      metadata: context.metadata,
    };
  }

  /**
   * Execute step with retry logic
   */
  private async executeWithRetry<T>(
    step: WorkflowStep,
    input: any,
    context: WorkflowContext
  ): Promise<{ data: T; attempts: number }> {
    const retryConfig = step.retryConfig || this.defaultRetry;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Apply timeout if specified
        const result = step.timeout
          ? await this.withTimeout(step.handler(input, context), step.timeout)
          : await step.handler(input, context);

        return { data: result, attempts: attempt };

      } catch (error) {
        lastError = error as Error;
        
        // If this is the last attempt, throw
        if (attempt === retryConfig.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with backoff
        const delay = retryConfig.backoff === "exponential"
          ? retryConfig.delayMs * Math.pow(2, attempt - 1)
          : retryConfig.delayMs * attempt;

        console.warn(
          `Step ${step.name} failed (attempt ${attempt}/${retryConfig.maxAttempts}). Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================
// PRE-BUILT WORKFLOWS
// ============================================================

/**
 * Content generation workflow with A/B testing
 */
export function createContentWorkflow(app: App = "synqra") {
  return new Workflow<
    { prompt: string; type: string; mode?: string },
    { content: string; variants?: string[]; refined?: string }
  >("generate_content", app)
    .step("validate_input", async (input) => {
      if (!input.prompt || input.prompt.trim().length < 10) {
        throw new Error("Prompt too short");
      }
      return input;
    })
    .step("generate_variants", async (input, ctx) => {
      const { aiClient } = await import("../ai/client");
      const result = await aiClient.generateMultiVersion({
        prompt: input.prompt,
        taskType: "creative",
        mode: input.mode as any,
        versions: 2,
      });
      return result.versions.map((v) => v.content);
    })
    .step("select_best", async (variants: string[]) => {
      // For now, return first variant
      // In production, could use ML scoring or user preference
      return variants[0];
    })
    .step("refine", async (content: string) => {
      const { aiClient } = await import("../ai/client");
      const refined = await aiClient.refine(content);
      return refined.content;
    }, {
      condition: async (_, ctx) => ctx.metadata.refineEnabled !== false,
    })
    .step("validate_output", async (content: string, ctx) => {
      const { validateContent } = await import("../validation");
      const validation = validateContent(content, ctx.metadata.type || "copy");
      if (!validation.passed) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }
      return content;
    });
}

/**
 * Campaign workflow
 */
export function createCampaignWorkflow(app: App = "synqra") {
  return new Workflow("create_campaign", app)
    .step("research", async (input: any) => {
      // Research phase - gather context
      return { insights: [], trends: [] };
    })
    .step("strategy", async (input: any) => {
      // Strategic planning
      return { objectives: [], channels: [], timeline: {} };
    })
    .parallel("content_generation", [
      async (input: any) => {
        // Generate email content
        return { type: "email", content: "" };
      },
      async (input: any) => {
        // Generate social content
        return { type: "social", content: "" };
      },
    ])
    .step("scheduling", async (input: any) => {
      // Schedule posts
      return { scheduled: [] };
    });
}

// ============================================================
// HELPERS
// ============================================================

function generateId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Quick workflow execution helper
 */
export async function executeWorkflow<TInput, TOutput>(
  workflow: Workflow<TInput, TOutput>,
  input: TInput,
  metadata?: Record<string, any>
): Promise<TOutput> {
  const result = await workflow.execute(input, metadata);
  
  if (result.status === "failed") {
    const failedStep = result.steps.find((s) => s.status === "failed");
    throw failedStep?.error || new Error("Workflow failed");
  }

  return result.data!;
}
