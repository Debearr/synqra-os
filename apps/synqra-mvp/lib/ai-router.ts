import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import aiRouterConfig from "@/config/ai-router.json";
import { callOpenRouter } from "@/lib/providers/openrouter";
import { callGemini } from "@/lib/providers/gemini";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/ai-cache";
import { enforceCouncilRateLimit } from "@/lib/middleware/rate-limit";
import { calculateCostUsd } from "@/lib/utils/cost-calculator";
import { validateOutput } from "@/lib/utils/output-validator";

type ProviderKey = "openrouter" | "gemini";

interface AiRouterRequest {
  task: string;
  prompt: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface AiUsageTotals {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface AiRouterResponse {
  text: string;
  provider: ProviderKey;
  model: string;
  usage: AiUsageTotals;
  costUsd: number;
  cached: boolean;
  budget: BudgetStatus;
}

interface BudgetStatus {
  usedUsd: number;
  alertUsd: number;
  hardStopUsd: number;
  state: "NORMAL" | "ALERT" | "HARD_STOP";
}

interface RateLimitDetails {
  remaining: number;
  limit: number;
  resetAt: string;
}

export class AiRouterError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let prismaClient: PrismaClient | null = null;

function getPrismaClient() {
  if (prismaClient) {
    return prismaClient;
  }

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  if (globalForPrisma.prisma) {
    prismaClient = globalForPrisma.prisma;
    return prismaClient;
  }

  prismaClient = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }
  return prismaClient;
}

function hashCacheKey(task: string, prompt: string) {
  return createHash("sha256").update(`${task}:${prompt}`).digest("hex");
}

function getOpenRouterKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("OPENROUTER_API_KEY is missing or empty");
  }
  return apiKey;
}

function getGeminiKeys() {
  const primary = process.env.GEMINI_API_KEY_1;
  const secondary = process.env.GEMINI_API_KEY_2;
  const keys = [primary, secondary].filter((key): key is string => !!key && key.trim() !== "");
  if (keys.length === 0) {
    throw new Error("Gemini API key is missing");
  }
  return keys;
}

function getMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

function getBudgetState(usedUsd: number, alertUsd: number, hardStopUsd: number) {
  if (usedUsd >= hardStopUsd) {
    return "HARD_STOP";
  }
  if (usedUsd >= alertUsd) {
    return "ALERT";
  }
  return "NORMAL";
}

export async function getBudgetStatus(): Promise<BudgetStatus> {
  const prisma = getPrismaClient();
  const monthStart = getMonthStart();
  const totals = await prisma.aiCallLog.aggregate({
    _sum: {
      costUsd: true,
    },
    where: {
      createdAt: {
        gte: monthStart,
      },
    },
  });

  const usedUsd = totals._sum.costUsd ?? 0;
  const alertUsd = aiRouterConfig.budget.alertUsd;
  const hardStopUsd = aiRouterConfig.budget.hardStopUsd;
  const state = getBudgetState(usedUsd, alertUsd, hardStopUsd);

  return {
    usedUsd,
    alertUsd,
    hardStopUsd,
    state,
  };
}

export async function getAiSpendSummary() {
  const prisma = getPrismaClient();
  const monthStart = getMonthStart();
  const totals = await prisma.aiCallLog.aggregate({
    _sum: {
      costUsd: true,
      totalTokens: true,
    },
    _count: {
      _all: true,
    },
    where: {
      createdAt: {
        gte: monthStart,
      },
    },
  });

  const byProvider = await prisma.aiCallLog.groupBy({
    by: ["provider", "model"],
    _sum: {
      costUsd: true,
      totalTokens: true,
    },
    _count: {
      _all: true,
    },
    where: {
      createdAt: {
        gte: monthStart,
      },
    },
    orderBy: {
      _sum: {
        costUsd: "desc",
      },
    },
  });

  return {
    monthStart: monthStart.toISOString(),
    totals: {
      costUsd: totals._sum.costUsd ?? 0,
      totalTokens: totals._sum.totalTokens ?? 0,
      calls: totals._count._all,
    },
    byProvider,
  };
}

async function logAiCall(input: {
  provider: ProviderKey;
  model: string;
  task: string;
  userId?: string;
  promptHash: string;
  usage: AiUsageTotals;
  costUsd: number;
  latencyMs: number;
}) {
  const prisma = getPrismaClient();
  await prisma.aiCallLog.create({
    data: {
      provider: input.provider,
      model: input.model,
      task: input.task,
      userId: input.userId ?? null,
      promptHash: input.promptHash,
      promptTokens: input.usage.promptTokens,
      completionTokens: input.usage.completionTokens,
      totalTokens: input.usage.totalTokens,
      costUsd: input.costUsd,
      latencyMs: input.latencyMs,
    },
  });
}

export async function routeAiRequest(
  request: AiRouterRequest
): Promise<AiRouterResponse> {
  const { task, prompt, userId } = request;
  if (!task || !prompt) {
    throw new AiRouterError("task and prompt are required", 400, "INVALID_INPUT");
  }

  const cacheKey = `ai:cache:${hashCacheKey(task, prompt)}`;
  const cached = await getCachedResponse<AiRouterResponse>(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const budgetStatus = await getBudgetStatus();
  if (budgetStatus.state === "HARD_STOP") {
    throw new AiRouterError(
      "Service temporarily unavailable due to budget limit",
      503,
      "BUDGET_HARD_STOP",
      budgetStatus
    );
  }

  const councilTask = aiRouterConfig.routing.councilTask;
  const isCouncil = task === councilTask;
  const provider: ProviderKey = isCouncil
    ? (aiRouterConfig.routing.councilProvider as ProviderKey)
    : (aiRouterConfig.routing.defaultProvider as ProviderKey);

  if (isCouncil && provider !== "openrouter") {
    throw new AiRouterError(
      "Council tasks must use OpenRouter",
      400,
      "INVALID_PROVIDER"
    );
  }
  if (!isCouncil && provider !== "gemini") {
    throw new AiRouterError(
      "Non-council tasks must use Gemini",
      400,
      "INVALID_PROVIDER"
    );
  }

  let rateLimitDetails: RateLimitDetails | undefined;
  if (isCouncil) {
    if (!userId) {
      throw new AiRouterError("userId is required for council tasks", 400, "MISSING_USER");
    }
    const limitResult = await enforceCouncilRateLimit(
      userId,
      aiRouterConfig.rateLimit.councilPerUserPerDay
    );
    rateLimitDetails = {
      remaining: limitResult.remaining,
      limit: limitResult.limit,
      resetAt: limitResult.resetAt,
    };
    if (!limitResult.allowed) {
      throw new AiRouterError(
        "Council rate limit exceeded",
        429,
        "RATE_LIMITED",
        rateLimitDetails
      );
    }
  }

  const promptHash = hashCacheKey(task, prompt);
  let callResult;

  if (provider === "openrouter") {
    callResult = await callOpenRouter({
      apiKey: getOpenRouterKey(),
      prompt,
      config: aiRouterConfig.providers.openrouter,
    });
  } else {
    callResult = await callGemini({
      apiKeys: getGeminiKeys(),
      prompt,
      config: aiRouterConfig.providers.gemini,
    });
  }

  const costUsd = calculateCostUsd(
    { totalTokens: callResult.usage.totalTokens },
    aiRouterConfig.providers[provider].cost
  );

  await logAiCall({
    provider,
    model: aiRouterConfig.providers[provider].model,
    task,
    userId,
    promptHash,
    usage: callResult.usage,
    costUsd,
    latencyMs: callResult.latencyMs,
  });

  try {
    validateOutput(callResult.text);
  } catch (error) {
    throw new AiRouterError(
      "Output blocked by policy",
      422,
      "OUTPUT_BLOCKED",
      {
        reason: error instanceof Error ? error.message : "Blocked phrase detected",
      }
    );
  }

  const updatedBudget: BudgetStatus = {
    usedUsd: budgetStatus.usedUsd + costUsd,
    alertUsd: budgetStatus.alertUsd,
    hardStopUsd: budgetStatus.hardStopUsd,
    state: getBudgetState(
      budgetStatus.usedUsd + costUsd,
      budgetStatus.alertUsd,
      budgetStatus.hardStopUsd
    ),
  };

  const response: AiRouterResponse = {
    text: callResult.text,
    provider,
    model: aiRouterConfig.providers[provider].model,
    usage: callResult.usage,
    costUsd,
    cached: false,
    budget: updatedBudget,
  };

  await setCachedResponse(cacheKey, response, aiRouterConfig.cache.ttlSeconds);
  return response;
}

export type { AiRouterRequest, AiRouterResponse, BudgetStatus, RateLimitDetails };
