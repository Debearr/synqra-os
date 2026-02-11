import { councilConfig } from "./config";
import type {
  CouncilAgentOutput,
  CouncilContext,
  CouncilResult,
  CouncilError,
} from "./types";
import { runAnalyzer } from "./agents/analyzer";
import { runValidator } from "./agents/validator";
import { runSynthesizer } from "./agents/synthesizer";
import {
  createCouncilAgent,
  createCouncilSession,
  logCouncilMessage,
} from "./logger";

function buildErrorResult(
  sessionId: string,
  start: number,
  error: CouncilError
): CouncilResult {
  return {
    success: false,
    sessionId,
    cost: 0,
    duration: Date.now() - start,
    error,
  };
}

async function runWithRetries(
  task: (signal: AbortSignal) => Promise<CouncilAgentOutput>,
  signal: AbortSignal
): Promise<CouncilAgentOutput> {
  let attempts = 0;
  let lastError: CouncilAgentOutput | undefined;

  while (attempts <= councilConfig.maxRetries) {
    if (signal.aborted) {
      return {
        success: false,
        error: { code: "timeout", message: "Council request timed out." },
      };
    }
    const result = await task(signal);
    if (result.success) {
      return result;
    }
    lastError = result;
    attempts += 1;
  }

  return (
    lastError || {
      success: false,
      error: { code: "groq_failed", message: "Council agent failed." },
    }
  );
}

function computeCost(tokens: number): number {
  return Number(((tokens / 1000) * councilConfig.costPer1kTokens).toFixed(6));
}

export async function queryCouncil(
  query: string,
  context: CouncilContext = {}
): Promise<CouncilResult> {
  const start = Date.now();
  const fallbackSessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}`;
  const userId = context.userId;
  const token = context.authToken;
  const safeContext = { ...context };
  delete safeContext.authToken;
  delete safeContext.userId;

  if (!userId || !token) {
    return buildErrorResult(fallbackSessionId, start, {
      code: "unauthorized",
      message: "Authentication required.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), councilConfig.timeoutMs);

  let sessionId = fallbackSessionId;
  let totalTokens = 0;
  let lastOutput = "";

  try {
    sessionId = await createCouncilSession({
      token,
      userId,
      title: typeof context.title === "string" ? context.title : undefined,
      metadata: safeContext,
    });

    if (!sessionId) {
      return buildErrorResult(fallbackSessionId, start, {
        code: "log_failed",
        message: "Unable to create council session.",
      });
    }

    await logCouncilMessage({
      token,
      userId,
      sessionId,
      role: "user",
      content: query,
      metadata: { context: safeContext },
    });

    const analyzerAgentId = await createCouncilAgent({
      token,
      userId,
      sessionId,
      name: "Analyzer",
      role: "Analyze request",
      model: councilConfig.model,
    });

    const analyzerResult = await runWithRetries(
      (signal) => runAnalyzer({ query, context, prior: lastOutput }, { signal }),
      controller.signal
    );

    if (!analyzerResult.success) {
      return buildErrorResult(sessionId, start, analyzerResult.error || {
        code: "groq_failed",
        message: "Analyzer failed.",
      });
    }

    totalTokens += (analyzerResult.usage?.inputTokens ?? 0) + (analyzerResult.usage?.outputTokens ?? 0);
    lastOutput = analyzerResult.content || "";

    await logCouncilMessage({
      token,
      userId,
      sessionId,
      agentId: analyzerAgentId || undefined,
      role: "assistant",
      content: lastOutput,
      metadata: { agent: "Analyzer" },
    });

    const validatorAgentId = await createCouncilAgent({
      token,
      userId,
      sessionId,
      name: "Validator",
      role: "Validate constraints",
      model: councilConfig.model,
    });

    const validatorResult = await runWithRetries(
      (signal) => runValidator({ query, context, prior: lastOutput }, { signal }),
      controller.signal
    );

    if (!validatorResult.success) {
      return buildErrorResult(sessionId, start, validatorResult.error || {
        code: "groq_failed",
        message: "Validator failed.",
      });
    }

    totalTokens += (validatorResult.usage?.inputTokens ?? 0) + (validatorResult.usage?.outputTokens ?? 0);
    lastOutput = validatorResult.content || "";

    await logCouncilMessage({
      token,
      userId,
      sessionId,
      agentId: validatorAgentId || undefined,
      role: "assistant",
      content: lastOutput,
      metadata: { agent: "Validator" },
    });

    const synthesizerAgentId = await createCouncilAgent({
      token,
      userId,
      sessionId,
      name: "Synthesizer",
      role: "Synthesize final response",
      model: councilConfig.model,
    });

    const synthesizerResult = await runWithRetries(
      (signal) => runSynthesizer({ query, context, prior: lastOutput }, { signal }),
      controller.signal
    );

    if (!synthesizerResult.success) {
      return buildErrorResult(sessionId, start, synthesizerResult.error || {
        code: "groq_failed",
        message: "Synthesizer failed.",
      });
    }

    totalTokens += (synthesizerResult.usage?.inputTokens ?? 0) + (synthesizerResult.usage?.outputTokens ?? 0);

    await logCouncilMessage({
      token,
      userId,
      sessionId,
      agentId: synthesizerAgentId || undefined,
      role: "assistant",
      content: synthesizerResult.content || "",
      metadata: { agent: "Synthesizer" },
    });

    return {
      success: true,
      response: synthesizerResult.content,
      sessionId,
      cost: computeCost(totalTokens),
      duration: Date.now() - start,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown council error";
    return buildErrorResult(sessionId, start, {
      code: "council_error",
      message,
    });
  } finally {
    clearTimeout(timeout);
  }
}
