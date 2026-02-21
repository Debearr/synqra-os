import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import { getGroqUsageSnapshot, hasGroqApiKey, requestGroq } from "@/lib/council/groq-client";
import {
  assertVertical,
  normalizeVertical,
  resolveVerticalFromTenantId,
  type TenantVertical,
  verticalTag,
} from "@/lib/verticals/tenant";
import {
  buildCouncilSystemInstruction,
  resolveCreatorStampEnabled,
  resolveCreatorStampRuntime,
  resolveIdentityProfile,
  type IdentityProfile,
} from "@/lib/identity/resolver";

type RiskLevel = "BASELINE" | "ELEVATED" | "CRITICAL";
type SynqraTier = "studio" | "studio_plus";
type SynqraPriority = "standard" | "priority";
type TierGatedFeature = "fx_signal_hub";
type UsageWindow = {
  windowStart: number;
  requestCount: number;
};
type TierPolicy = {
  maxPromptChars: number;
  maxRequestsPerMinute: number;
  priority: SynqraPriority;
  fxSignalHubEnabled: boolean;
};

type CouncilRequestBody = {
  prompt?: string;
  identityProfile?: string;
  creatorStampEnabled?: boolean | string;
  intent?: string;
  taskType?: string;
  premiumIntent?: boolean;
  intentFlags?: {
    premium?: boolean;
  };
  tenant?: {
    id?: string;
    vertical?: string;
  };
};

type CouncilProvider = "groq" | "openrouter" | "ollama";
type CouncilRouteIntent = "public" | "internal";
type CouncilModelTier = "fast" | "premium";
type CouncilTaskType = "general" | "analysis" | "compliance" | "internal_ops";
type ProviderModelMap = Record<CouncilProvider, string>;
type ProviderTokenCapMap = Record<CouncilProvider, number>;
type CouncilRoutingPolicy = {
  intent: CouncilRouteIntent;
  modelTier: CouncilModelTier;
  taskType: CouncilTaskType;
  providerOrder: CouncilProvider[];
  modelMap: ProviderModelMap;
  tokenCaps: ProviderTokenCapMap;
  premiumRequested: boolean;
};

const RESTRICTED_MESSAGE = "Restricted by governance.";
const RESTRICTED_PATTERNS = [
  /\bwire\s+transfer\b/i,
  /\bbank\s+account\b/i,
  /\bssn\b/i,
  /\bsocial\s+security\b/i,
  /\bcredit\s+card\b/i,
  /\bprivate\s+key\b/i,
  /\bseed\s+phrase\b/i,
];
const COMPLIANCE_MAX_PROMPT_CHARS = 4000;
const FX_SIGNAL_PATTERNS = [/\bfx\b/i, /\bforex\b/i, /\bsignal\s*hub\b/i, /\btelegram\s+signal/i];
const RATE_WINDOW_MS = 60_000;
const parsedProviderTimeoutMs = Number.parseInt(process.env.COUNCIL_PROVIDER_TIMEOUT_MS || "12000", 10);
const PROVIDER_TIMEOUT_MS = Number.isFinite(parsedProviderTimeoutMs) ? Math.max(parsedProviderTimeoutMs, 1_000) : 12_000;
const PROVIDER_RETRY_ATTEMPTS = 2;
const usageWindows = new Map<string, UsageWindow>();
const STUDIO_PLUS_TOKENS = new Set([
  "studio_plus",
  "studio-plus",
  "plus",
  "pro",
  "premium",
  "99",
  "99_usd",
]);
const TIER_POLICIES: Record<SynqraTier, TierPolicy> = {
  studio: {
    maxPromptChars: 1200,
    maxRequestsPerMinute: 8,
    priority: "standard",
    fxSignalHubEnabled: false,
  },
  studio_plus: {
    maxPromptChars: 2400,
    maxRequestsPerMinute: 24,
    priority: "priority",
    fxSignalHubEnabled: true,
  },
};

const PROVIDER_ORDER: Record<CouncilRouteIntent, CouncilProvider[]> = {
  public: ["groq", "openrouter"],
  internal: ["ollama", "groq", "openrouter"],
};

const TASK_MODEL_MAP: Record<CouncilTaskType, Record<CouncilModelTier, ProviderModelMap>> = {
  general: {
    fast: {
      groq: "llama-3.1-8b-instant",
      openrouter: "anthropic/claude-sonnet-4.5",
      ollama: "llama3.1:8b",
    },
    premium: {
      groq: "qwen/qwen3-32b",
      openrouter: "openai/gpt-oss-120b",
      ollama: "qwen2.5:14b",
    },
  },
  analysis: {
    fast: {
      groq: "llama-3.1-8b-instant",
      openrouter: "anthropic/claude-sonnet-4.5",
      ollama: "qwen2.5:7b",
    },
    premium: {
      groq: "qwen/qwen3-32b",
      openrouter: "openai/gpt-oss-120b",
      ollama: "qwen2.5:14b",
    },
  },
  compliance: {
    fast: {
      groq: "llama-3.1-8b-instant",
      openrouter: "anthropic/claude-sonnet-4.5",
      ollama: "qwen2.5:7b",
    },
    premium: {
      groq: "qwen/qwen3-32b",
      openrouter: "openai/gpt-oss-120b",
      ollama: "qwen2.5:14b",
    },
  },
  internal_ops: {
    fast: {
      groq: "llama-3.1-8b-instant",
      openrouter: "anthropic/claude-sonnet-4.5",
      ollama: "llama3.1:8b",
    },
    premium: {
      groq: "qwen/qwen3-32b",
      openrouter: "openai/gpt-oss-120b",
      ollama: "qwen2.5:14b",
    },
  },
};

const TOKEN_CAPS: Record<CouncilRouteIntent, Record<CouncilModelTier, ProviderTokenCapMap>> = {
  public: {
    fast: {
      groq: 280,
      openrouter: 500,
      ollama: 0,
    },
    premium: {
      groq: 420,
      openrouter: 700,
      ollama: 0,
    },
  },
  internal: {
    fast: {
      groq: 280,
      openrouter: 500,
      ollama: 320,
    },
    premium: {
      groq: 420,
      openrouter: 700,
      ollama: 512,
    },
  },
};

const GROQ_MODEL_ALLOWLIST = new Set([
  "llama-3.1-8b-instant",
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
]);

const OPENROUTER_MODEL_ALLOWLIST = new Set([
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-oss-120b",
  "openai/gpt-4o-mini",
]);

const OLLAMA_MODEL_ALLOWLIST = new Set([
  "llama3.1:8b",
  "qwen2.5:14b",
  "qwen2.5:7b",
]);

class PublicGatekeeperError extends Error {
  constructor(
    message: string,
    public status: number = 429
  ) {
    super(message);
    this.name = "PublicGatekeeperError";
  }
}

const normalizeTierToken = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return normalized.length > 0 ? normalized : null;
};

const collectTierTokens = (record: Record<string, unknown> | undefined): string[] => {
  if (!record) return [];
  return [
    record.tier,
    record.plan,
    record.subscription_tier,
    record.subscription_plan,
    record.product_tier,
  ]
    .map(normalizeTierToken)
    .filter((value): value is string => Boolean(value));
};

const resolveSynqraTier = (user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): SynqraTier => {
  const tokens = [
    ...collectTierTokens(user.app_metadata),
    ...collectTierTokens(user.user_metadata),
  ];
  if (tokens.some((token) => STUDIO_PLUS_TOKENS.has(token))) {
    return "studio_plus";
  }
  return "studio";
};

const getTierPolicy = (tier: SynqraTier): TierPolicy => TIER_POLICIES[tier];

const enforceTierFeatureAccess = (
  tier: SynqraTier,
  feature: TierGatedFeature,
  restrictedMessage: string
): void => {
  const policy = getTierPolicy(tier);
  if (feature === "fx_signal_hub" && !policy.fxSignalHubEnabled) {
    throw new PublicGatekeeperError(restrictedMessage, 403);
  }
};

const enforceTierUsage = (input: {
  tier: SynqraTier;
  actorKey: string;
  prompt: string;
  restrictedMessage: string;
}): void => {
  const policy = getTierPolicy(input.tier);
  const promptLength = input.prompt.trim().length;
  if (promptLength > policy.maxPromptChars) {
    throw new PublicGatekeeperError(input.restrictedMessage, 413);
  }

  const now = Date.now();
  const existing = usageWindows.get(input.actorKey);
  if (!existing || now - existing.windowStart >= RATE_WINDOW_MS) {
    usageWindows.set(input.actorKey, { windowStart: now, requestCount: 1 });
    return;
  }

  if (existing.requestCount >= policy.maxRequestsPerMinute) {
    throw new PublicGatekeeperError(input.restrictedMessage, 429);
  }

  existing.requestCount += 1;
  usageWindows.set(input.actorKey, existing);
};

const evaluateCompliance = (prompt: string): { allowed: boolean; risk: RiskLevel; reason: string } => {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { allowed: false, risk: "CRITICAL", reason: RESTRICTED_MESSAGE };
  }

  if (trimmed.length > COMPLIANCE_MAX_PROMPT_CHARS) {
    return { allowed: false, risk: "ELEVATED", reason: RESTRICTED_MESSAGE };
  }

  if (RESTRICTED_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { allowed: false, risk: "CRITICAL", reason: RESTRICTED_MESSAGE };
  }

  return { allowed: true, risk: "BASELINE", reason: "Allowed" };
};

const normalizePolicyIntent = (rawIntent: string | null | undefined): CouncilRouteIntent => {
  const value = (rawIntent ?? "").trim().toLowerCase();
  if (value === "internal" || value === "ops" || value === "ba_ops") {
    return "internal";
  }
  return "public";
};

const normalizePolicyTaskType = (rawTaskType: string | null | undefined): CouncilTaskType => {
  const value = (rawTaskType ?? "").trim().toLowerCase();
  if (value === "analysis" || value === "reasoning") return "analysis";
  if (value === "compliance" || value === "policy") return "compliance";
  if (value === "internal_ops" || value === "internal" || value === "ops") return "internal_ops";
  return "general";
};

const resolveAllowedModel = (
  overrideValue: string | undefined,
  fallbackValue: string,
  allowlist: Set<string>
): string => {
  const trimmed = overrideValue?.trim();
  if (trimmed && allowlist.has(trimmed)) {
    return trimmed;
  }
  return fallbackValue;
};

const resolveCouncilRoutingPolicy = (input: {
  intent?: string | null;
  taskType?: string | null;
  premiumIntent?: boolean;
}): CouncilRoutingPolicy => {
  const intent = normalizePolicyIntent(input.intent);
  const taskType = normalizePolicyTaskType(input.taskType);
  const premiumRequested = input.premiumIntent === true;
  const modelTier: CouncilModelTier = premiumRequested ? "premium" : "fast";
  const defaults = TASK_MODEL_MAP[taskType][modelTier];

  const modelMap: ProviderModelMap = {
    groq: resolveAllowedModel(
      premiumRequested ? process.env.GROQ_PREMIUM_MODEL : process.env.GROQ_MODEL,
      defaults.groq,
      GROQ_MODEL_ALLOWLIST
    ),
    openrouter: resolveAllowedModel(
      premiumRequested ? process.env.OPENROUTER_PREMIUM_MODEL : process.env.OPENROUTER_MODEL,
      defaults.openrouter,
      OPENROUTER_MODEL_ALLOWLIST
    ),
    ollama: resolveAllowedModel(
      premiumRequested ? process.env.OLLAMA_PREMIUM_MODEL : process.env.OLLAMA_MODEL,
      defaults.ollama,
      OLLAMA_MODEL_ALLOWLIST
    ),
  };

  return {
    intent,
    modelTier,
    taskType,
    providerOrder: PROVIDER_ORDER[intent],
    modelMap,
    tokenCaps: TOKEN_CAPS[intent][modelTier],
    premiumRequested,
  };
};

const buildDeterministicSeed = (prompt: string, tier: SynqraTier): number => {
  const digest = createHash("sha256").update(`${tier}:${prompt}`).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
};

const normalizeEchoText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const isEchoContent = (prompt: string, content: string): boolean => {
  const normalizedPrompt = normalizeEchoText(prompt);
  const normalizedContent = normalizeEchoText(content);
  if (!normalizedPrompt || !normalizedContent) return false;
  if (normalizedPrompt === normalizedContent) return true;
  if (normalizedPrompt.length >= 60 && normalizedContent.includes(normalizedPrompt)) return true;
  return false;
};

const resolveActorKey = (request: NextRequest, userId: string | null): string => {
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : request.headers.get("x-real-ip");
  if (ip) {
    return `ip:${ip}`;
  }
  return `ua:${request.headers.get("user-agent") || "unknown"}`;
};

const resolveRequestedIntent = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const resolvePremiumIntent = (body: CouncilRequestBody | null): boolean => {
  return body?.premiumIntent === true || body?.intentFlags?.premium === true;
};

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MAX_PROMPT_CHARS = 2400;
const OLLAMA_MAX_PROMPT_CHARS = 2400;

const hasOpenRouterApiKey = (): boolean => Boolean(process.env.OPENROUTER_API_KEY?.trim());
const hasOllamaConfigured = (): boolean => {
  const toggle = process.env.OLLAMA_ENABLED?.trim().toLowerCase();
  return !(toggle === "false" || toggle === "0");
};

const parseOpenRouterMessageContent = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    const merged = value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const text = (entry as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      })
      .join("")
      .trim();
    return merged || null;
  }
  return null;
};

const requestOpenRouter = async (input: {
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens: number;
  seed: number;
  signal: AbortSignal;
}): Promise<{ ok: true; content: string; model: string } | { ok: false; error: string }> => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY is missing." };
  }

  const prompt = input.prompt.trim();
  if (!prompt) {
    return { ok: false, error: "Prompt is required." };
  }
  if (prompt.length > OPENROUTER_MAX_PROMPT_CHARS) {
    return { ok: false, error: `Prompt exceeds ${OPENROUTER_MAX_PROMPT_CHARS} characters.` };
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (input.systemPrompt?.trim()) {
    messages.push({ role: "system", content: input.systemPrompt.trim() });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_REFERER?.trim() || "https://synqra.com",
        "X-Title": process.env.OPENROUTER_TITLE?.trim() || "Synqra Council",
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.1,
        max_tokens: Math.max(1, Math.floor(input.maxTokens)),
        seed: input.seed,
        messages,
      }),
      signal: input.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          choices?: Array<{ message?: { content?: unknown } }>;
          model?: string;
          error?: { message?: string };
        }
      | null;
    if (!response.ok) {
      const reason = payload?.error?.message || `OpenRouter status ${response.status}`;
      return { ok: false, error: reason };
    }

    const content = parseOpenRouterMessageContent(payload?.choices?.[0]?.message?.content);
    if (!content) {
      return { ok: false, error: "OpenRouter returned empty response." };
    }

    return {
      ok: true,
      content,
      model: payload?.model || input.model,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "OpenRouter request failed",
    };
  }
};

const requestOllama = async (input: {
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens: number;
  signal: AbortSignal;
}): Promise<{ ok: true; content: string; model: string } | { ok: false; error: string }> => {
  const prompt = input.prompt.trim();
  if (!prompt) {
    return { ok: false, error: "Prompt is required." };
  }
  if (prompt.length > OLLAMA_MAX_PROMPT_CHARS) {
    return { ok: false, error: `Prompt exceeds ${OLLAMA_MAX_PROMPT_CHARS} characters.` };
  }

  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        stream: false,
        messages: [
          ...(input.systemPrompt?.trim() ? [{ role: "system" as const, content: input.systemPrompt.trim() }] : []),
          { role: "user" as const, content: prompt },
        ],
        options: {
          temperature: 0.1,
          num_predict: Math.max(1, Math.floor(input.maxTokens)),
        },
      }),
      signal: input.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          message?: { content?: string };
          model?: string;
          error?: string;
        }
      | null;
    if (!response.ok) {
      return { ok: false, error: payload?.error || `Ollama status ${response.status}` };
    }

    const content = payload?.message?.content?.trim();
    if (!content) {
      return { ok: false, error: "Ollama returned empty response." };
    }

    return {
      ok: true,
      content,
      model: payload?.model || input.model,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ollama request failed",
    };
  }
};

const withTimeout = async <T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const isProviderReady = (provider: CouncilProvider): boolean => {
  if (provider === "groq") return hasGroqApiKey();
  if (provider === "openrouter") return hasOpenRouterApiKey();
  if (provider === "ollama") return hasOllamaConfigured();
  return false;
};

const runProvider = async (input: {
  provider: CouncilProvider;
  policy: CouncilRoutingPolicy;
  prompt: string;
  systemInstruction: string;
  deterministicSeed: number;
  signal: AbortSignal;
}): Promise<{ ok: true; content: string; model: string; usageCount?: number } | { ok: false; error: string }> => {
  if (input.provider === "groq") {
    const result = await requestGroq({
      prompt: input.prompt,
      systemPrompt: input.systemInstruction,
      temperature: 0.1,
      maxTokens: input.policy.tokenCaps.groq,
      model: input.policy.modelMap.groq,
      signal: input.signal,
    });
    if (!result.success || !result.content) {
      return { ok: false, error: result.error?.message || "Groq request failed" };
    }
    return {
      ok: true,
      content: result.content,
      model: result.model || input.policy.modelMap.groq,
      usageCount: getGroqUsageSnapshot().calls,
    };
  }

  if (input.provider === "openrouter") {
    const result = await requestOpenRouter({
      prompt: input.prompt,
      systemPrompt: input.systemInstruction,
      maxTokens: input.policy.tokenCaps.openrouter,
      model: input.policy.modelMap.openrouter,
      seed: input.deterministicSeed,
      signal: input.signal,
    });
    if (!result.ok) {
      return { ok: false, error: result.error || "OpenRouter request failed" };
    }
    return {
      ok: true,
      content: result.content,
      model: result.model || input.policy.modelMap.openrouter,
    };
  }

  const result = await requestOllama({
    prompt: input.prompt,
    systemPrompt: input.systemInstruction,
    maxTokens: input.policy.tokenCaps.ollama,
    model: input.policy.modelMap.ollama,
    signal: input.signal,
  });
  if (!result.ok) {
    return { ok: false, error: result.error || "Ollama request failed" };
  }
  return {
    ok: true,
    content: result.content,
    model: result.model || input.policy.modelMap.ollama,
  };
};

const generateContent = async (input: {
  prompt: string;
  tier: SynqraTier;
  systemInstruction: string;
  intent: string | null;
  taskType: string | null;
  premiumIntent: boolean;
  requestId: string;
}): Promise<{
  content: string;
  provider: CouncilProvider;
  model: string;
  modelTier: "fast" | "premium";
  routeIntent: CouncilRouteIntent;
  taskType: CouncilTaskType;
  tokenCap: number;
  fallbackCount: number;
  premiumRequested: boolean;
  groqUsageCount?: number;
}> => {
  const providerErrors: string[] = [];
  const policy = resolveCouncilRoutingPolicy({
    intent: input.intent,
    taskType: input.taskType,
    premiumIntent: input.premiumIntent,
  });
  const deterministicSeed = buildDeterministicSeed(input.prompt, input.tier);
  let fallbackCount = 0;

  console.info(
    JSON.stringify({
      level: "info",
      message: "council.routing.policy",
      requestId: input.requestId,
      intent: policy.intent,
      taskType: policy.taskType,
      modelTier: policy.modelTier,
      providerOrder: policy.providerOrder,
      premiumRequested: policy.premiumRequested,
    })
  );

  for (const provider of policy.providerOrder) {
    if (!isProviderReady(provider)) {
      providerErrors.push(`${provider}: provider not configured`);
      continue;
    }

    for (let attempt = 1; attempt <= PROVIDER_RETRY_ATTEMPTS; attempt += 1) {
      console.info(
        JSON.stringify({
          level: "info",
          message: "council.provider.attempt",
          requestId: input.requestId,
          provider,
          attempt,
          timeoutMs: PROVIDER_TIMEOUT_MS,
          model: policy.modelMap[provider],
          tokenCap: policy.tokenCaps[provider],
        })
      );

      try {
        const result = await withTimeout((signal) =>
          runProvider({
            provider,
            policy,
            prompt: input.prompt,
            systemInstruction: input.systemInstruction,
            deterministicSeed,
            signal,
          })
        );

        if (result.ok) {
          if (isEchoContent(input.prompt, result.content)) {
            throw new Error(`${provider} returned echoed prompt content`);
          }
          return {
            content: result.content,
            provider,
            model: result.model,
            modelTier: policy.modelTier,
            routeIntent: policy.intent,
            taskType: policy.taskType,
            tokenCap: policy.tokenCaps[provider],
            fallbackCount,
            premiumRequested: policy.premiumRequested,
            groqUsageCount: provider === "groq" ? result.usageCount : undefined,
          };
        }

        providerErrors.push(`${provider} attempt ${attempt}: ${result.error}`);
        console.error(
          JSON.stringify({
            level: "error",
            message: "council.provider.failure",
            requestId: input.requestId,
            provider,
            attempt,
            error: result.error,
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Provider execution failed";
        providerErrors.push(`${provider} attempt ${attempt}: ${message}`);
        console.error(
          JSON.stringify({
            level: "error",
            message: "council.provider.failure",
            requestId: input.requestId,
            provider,
            attempt,
            error: message,
          })
        );
      }
    }

    fallbackCount += 1;
  }

  throw new Error(`Council generation failed across providers: ${providerErrors.join(" | ")}`);
};

/**
 * POST /api/council
 * Single creation-engine endpoint for the studio demo flow.
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let role = "guest";
    let tier: SynqraTier = "studio";
    let userId: string | null = null;
    if (authHeader) {
      try {
        const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        });

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          role = "authenticated";
          tier = resolveSynqraTier(user);
          userId = typeof user.id === "string" ? user.id : null;
        }
      } catch (authError) {
        console.warn("Auth resolution failed; continuing as guest.", authError);
      }
    }

    const body = (await request.json().catch(() => null)) as CouncilRequestBody | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const requestedIntent = resolveRequestedIntent(body?.intent);
    const requestedTaskType = resolveRequestedIntent(body?.taskType);
    const premiumIntent = resolvePremiumIntent(body);
    const requestedTenantId = typeof body?.tenant?.id === "string" ? body.tenant.id.trim() : "";
    const requestedVertical = normalizeVertical(body?.tenant?.vertical);
    let tenantVertical: TenantVertical = requestedVertical ?? resolveVerticalFromTenantId(requestedTenantId || "realtor");
    if (requestedTenantId) {
      const inferred = resolveVerticalFromTenantId(requestedTenantId);
      try {
        assertVertical(
          { tenantId: requestedTenantId, vertical: inferred, source: "request" },
          requestedVertical ?? inferred
        );
      } catch (error) {
        return NextResponse.json(
          {
            error: "Invalid tenant vertical context",
            message: error instanceof Error ? error.message : "Vertical mismatch",
          },
          { status: 400 }
        );
      }
      tenantVertical = requestedVertical ?? inferred;
    }
    const identityProfile: IdentityProfile = resolveIdentityProfile(body?.identityProfile ?? null);
    const creatorStampEnabled = resolveCreatorStampEnabled(body?.creatorStampEnabled);
    const creatorStamp = resolveCreatorStampRuntime(creatorStampEnabled);
    const systemInstruction = buildCouncilSystemInstruction({
      identityProfile,
      creatorStampEnabled,
    });
    const actorKey = resolveActorKey(request, userId);
    if (!prompt) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "The 'prompt' field is required and must be a string",
        },
        { status: 400 }
      );
    }

    try {
      enforceTierUsage({
        tier,
        actorKey,
        prompt,
        restrictedMessage: RESTRICTED_MESSAGE,
      });

      const requestsFxSignalHub = FX_SIGNAL_PATTERNS.some((pattern) => pattern.test(prompt));
      if (requestsFxSignalHub) {
        enforceTierFeatureAccess(tier, "fx_signal_hub", RESTRICTED_MESSAGE);
      }
    } catch (gateError) {
      if (gateError instanceof PublicGatekeeperError) {
        return NextResponse.json(
          {
            error: gateError.message,
            metadata: {
              risk: "ELEVATED" as RiskLevel,
              role,
              tier,
              vertical: tenantVertical,
              verticalTag: verticalTag(tenantVertical),
              processingPriority: getTierPolicy(tier).priority,
              fxSignalHubEnabled: getTierPolicy(tier).fxSignalHubEnabled,
              identityProfile,
              creatorStamp,
            },
          },
          { status: gateError.status }
        );
      }
      throw gateError;
    }

    const compliance = evaluateCompliance(prompt);
    if (!compliance.allowed) {
      return NextResponse.json(
        {
          error: compliance.reason,
          metadata: {
            risk: compliance.risk,
            role,
            tier,
            vertical: tenantVertical,
            verticalTag: verticalTag(tenantVertical),
            processingPriority: getTierPolicy(tier).priority,
            fxSignalHubEnabled: getTierPolicy(tier).fxSignalHubEnabled,
            identityProfile,
            creatorStamp,
          },
        },
        { status: 403 }
      );
    }

    const requestId = `content_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    let generated: {
      content: string;
      provider: CouncilProvider;
      model: string;
      modelTier: "fast" | "premium";
      routeIntent: CouncilRouteIntent;
      taskType: CouncilTaskType;
      tokenCap: number;
      fallbackCount: number;
      premiumRequested: boolean;
      groqUsageCount?: number;
    };
    try {
      generated = await generateContent({
        prompt,
        tier,
        systemInstruction,
        intent: requestedIntent,
        taskType: requestedTaskType,
        premiumIntent,
        requestId,
      });
    } catch (generationError) {
      const tierPolicy = getTierPolicy(tier);
      return NextResponse.json(
        {
          error: "Creation provider unavailable",
          message: generationError instanceof Error ? generationError.message : "Provider error",
          metadata: {
            risk: "CRITICAL" as RiskLevel,
            role,
            tier,
            vertical: tenantVertical,
            verticalTag: verticalTag(tenantVertical),
            processingPriority: tierPolicy.priority,
            fxSignalHubEnabled: tierPolicy.fxSignalHubEnabled,
            identityProfile,
            creatorStamp,
          },
        },
        { status: 503 }
      );
    }
    const {
      content,
      provider,
      model,
      modelTier,
      routeIntent,
      taskType,
      tokenCap,
      fallbackCount,
      premiumRequested,
      groqUsageCount,
    } = generated;
    const tierPolicy = getTierPolicy(tier);
    if (isEchoContent(prompt, content)) {
      return NextResponse.json(
        {
          error: "Creation provider returned non-transformative output",
          message: RESTRICTED_MESSAGE,
          metadata: {
            risk: "ELEVATED" as RiskLevel,
            role,
            tier,
            vertical: tenantVertical,
            verticalTag: verticalTag(tenantVertical),
            processingPriority: tierPolicy.priority,
            fxSignalHubEnabled: tierPolicy.fxSignalHubEnabled,
            provider,
            identityProfile,
            creatorStamp,
          },
        },
        { status: 503 }
      );
    }

    const agentHopCount = 1;
    console.info(
      JSON.stringify({
        level: "info",
        message: "council.request.completed",
          requestId,
          provider,
          model,
          modelTier,
          routeIntent,
          taskType,
          tokenCap,
          fallbackCount,
          premiumRequested,
          agentHopCount,
          tier,
          vertical: tenantVertical,
      })
    );
    if (agentHopCount > 3) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "council.agent_hop_exceeded",
          requestId,
          agentHopCount,
        })
      );
    }

    const response = NextResponse.json(
      {
        content,
        consensus: content,
        responses: [
          {
            member: {
              model: provider,
              name: `${identityProfile.toUpperCase()} Studio`,
              role: "Content Engine",
            },
            response: content,
            tokens: {
              total: 0,
              prompt: 0,
              completion: 0,
            },
          },
        ],
        timestamp: new Date().toISOString(),
        metadata: {
          requestId,
          risk: compliance.risk,
          role,
          tier,
          vertical: tenantVertical,
          verticalTag: verticalTag(tenantVertical),
          processingPriority: tierPolicy.priority,
          fxSignalHubEnabled: tierPolicy.fxSignalHubEnabled,
          provider,
          model,
          modelTier,
          routeIntent,
          taskType,
          tokenCap,
          fallbackCount,
          premiumRequested,
          groqUsageCount: typeof groqUsageCount === "number" ? groqUsageCount : undefined,
          identityProfile,
          creatorStamp,
        },
      },
      { status: 200 }
    );
    response.headers.set("x-council-provider", provider);
    response.headers.set("x-council-model", model);
    response.headers.set("x-council-model-tier", modelTier);
    response.headers.set("x-council-intent", routeIntent);
    response.headers.set("x-council-task-type", taskType);
    response.headers.set("x-council-token-cap", String(tokenCap));
    response.headers.set("x-council-fallback-count", String(fallbackCount));
    if (provider === "groq" && typeof groqUsageCount === "number") {
      response.headers.set("x-groq-usage-count", String(groqUsageCount));
    }
    return response;
  } catch (error) {
    console.error("Council API error:", error);
    return NextResponse.json(
      {
        error: "Creation request failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/council
 * Returns information about the creation endpoint.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/council",
    method: "POST",
    description: "Single creation-engine endpoint for studio demo flow",
    requestSchema: {
      prompt: "string (required) - The prompt for generation",
      identityProfile: "string (optional) - one of synqra | noid | aurafx",
      creatorStampEnabled: "boolean (optional, default false)",
      intent: "string (optional) - public | internal",
      taskType: "string (optional) - general | analysis | compliance | internal_ops",
      premiumIntent: "boolean (optional, default false) - explicit premium model gate",
    },
    example: {
      prompt: "Generate a listing launch brief for this property",
      intent: "public",
      taskType: "general",
      premiumIntent: false,
    },
  });
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

export async function DELETE() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

export async function PATCH() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

