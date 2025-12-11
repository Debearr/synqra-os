import { routeModel } from "./router/router";
import { getPromptByTask, renderPrompt } from "./prompt-templates/library";
import { validateRequest } from "./validators/input";
import { OutputShape, validateStructuredResult } from "./validators/output";
import { IntelligenceRequest, StructuredResult } from "./types";
import { parseStructuredOutput } from "../lib/structured-output";

const now = () => Math.round(performance.now());

export interface PipelineResult {
  promptId: string;
  routingModel: string;
  fallbackModel?: string;
  output: StructuredResult<OutputShape>;
}

type RunModel = (params: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  responseFormat: "json" | "text";
}) => Promise<{ output: unknown; usedTokens: number; latencyMs?: number }>;

export const executePipeline = async (
  data: unknown,
  runModel: RunModel,
): Promise<PipelineResult> => {
  const validation = validateRequest(data);
  if (!validation.ok) {
    throw new Error(`Invalid request: ${validation.issues.join(", ")}`);
  }

  const request: IntelligenceRequest = validation.value;
  const decision = routeModel(request);
  const prompt = getPromptByTask(request.task);
  const rendered = renderPrompt(prompt, request.input, {
    audience: request.audience,
    tone: request.tone,
  });

  const requestedMaxTokens = request.maxTokens ?? decision.selected.maxOutputTokens;
  const responseFormat: "json" | "text" = prompt.schemaHint ? "json" : "text";
  const start = now();
  const result = await runModel({
    model: decision.selected.model,
    system: rendered.system,
    user: rendered.user,
    maxTokens: requestedMaxTokens,
    responseFormat,
  });
  const latencyMs = result.latencyMs ?? now() - start;

  const parsed = parseStructuredOutput<OutputShape>(result.output, prompt.schemaHint);
  const normalizedOutput: OutputShape = prompt.schemaHint
    ? parsed
    : typeof parsed === "string"
      ? { content: parsed }
      : (parsed as OutputShape);
  const traceId = crypto.randomUUID();

  const checked = validateStructuredResult(normalizedOutput, {
    model: decision.selected.model,
    promptId: prompt.id,
    usedTokens: result.usedTokens,
    latencyMs,
    traceId,
  });

  if (!checked.ok) {
    const fallback = decision.fallback;
    throw new Error(
      `Structured output validation failed: ${checked.issues.join(", ")} ${fallback ? `| fallback ready: ${fallback.model}` : ""}`,
    );
  }

  return {
    promptId: prompt.id,
    routingModel: decision.selected.model,
    fallbackModel: decision.fallback?.model,
    output: checked.value,
  };
};
