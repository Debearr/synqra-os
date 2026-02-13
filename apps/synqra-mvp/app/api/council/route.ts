import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
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
  tenant?: {
    id?: string;
    vertical?: string;
  };
};

const ALLOWED_ROLES = new Set(["guest", "authenticated", "demo", "member", "admin", "owner"]);
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
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const RATE_WINDOW_MS = 60_000;
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

const toRole = (user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) => {
  const appRole = user.app_metadata?.role;
  if (typeof appRole === "string" && appRole.trim().length > 0) {
    return appRole.trim().toLowerCase();
  }

  const userRole = user.user_metadata?.role;
  if (typeof userRole === "string" && userRole.trim().length > 0) {
    return userRole.trim().toLowerCase();
  }

  return "authenticated";
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

const isConfiguredKey = (value: string | undefined): value is string => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("your_") || trimmed.endsWith("_here")) return false;
  return true;
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

const parseOpenRouterContent = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message;
  const content = message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  if (Array.isArray(content)) {
    const flattened = content
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const text = (item as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      })
      .join("")
      .trim();
    return flattened || null;
  }
  return null;
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

const generateContent = async (input: {
  prompt: string;
  tier: SynqraTier;
  systemInstruction: string;
}): Promise<{ content: string; provider: string }> => {
  const providerErrors: string[] = [];
  const tierPolicy = getTierPolicy(input.tier);
  const deterministicSeed = buildDeterministicSeed(input.prompt, input.tier);

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const hasOpenRouter = isConfiguredKey(openRouterApiKey);
  const geminiApiKey = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].find(
    isConfiguredKey
  );
  const hasGemini = Boolean(geminiApiKey);

  if (!hasOpenRouter && !hasGemini) {
    throw new Error("No AI providers are configured for council generation");
  }

  if (hasOpenRouter) {
    const attempts = tierPolicy.priority === "priority" ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Synqra Studio (Local Dev)",
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            temperature: 0.1,
            top_p: 0.2,
            seed: deterministicSeed,
            max_tokens: input.tier === "studio_plus" ? 900 : 500,
            messages: [
              { role: "system", content: input.systemInstruction },
              { role: "user", content: input.prompt },
            ],
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const reason =
            (payload as { error?: { message?: string } })?.error?.message || `OpenRouter status ${response.status}`;
          throw new Error(reason);
        }

        const content = parseOpenRouterContent(payload);
        if (content) {
          if (isEchoContent(input.prompt, content)) {
            throw new Error("OpenRouter returned echoed prompt content");
          }
          return { content, provider: "openrouter" };
        }
        throw new Error("OpenRouter returned empty content");
      } catch (error) {
        providerErrors.push(error instanceof Error ? error.message : "OpenRouter call failed");
      }
    }
  }

  if (geminiApiKey) {
    try {
      const client = new GoogleGenerativeAI(geminiApiKey);
      const model = client.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          temperature: 0.1,
          topP: 0.2,
          maxOutputTokens: input.tier === "studio_plus" ? 1024 : 640,
          ...(deterministicSeed ? ({ seed: deterministicSeed } as Record<string, unknown>) : {}),
        },
      });
      const result = await model.generateContent([
        input.systemInstruction,
        "",
        `Prompt: ${input.prompt}`,
      ]);
      const content = result.response.text().trim();
      if (content) {
        if (isEchoContent(input.prompt, content)) {
          throw new Error("Gemini returned echoed prompt content");
        }
        return { content, provider: "gemini" };
      }
      throw new Error("Gemini returned empty content");
    } catch (error) {
      providerErrors.push(error instanceof Error ? error.message : "Gemini call failed");
    }
  }

  throw new Error(
    `Council generation failed across providers: ${providerErrors.join(" | ") || "unknown provider error"}`
  );
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
          role = toRole(user);
          tier = resolveSynqraTier(user);
          userId = typeof user.id === "string" ? user.id : null;
        }
      } catch (authError) {
        console.warn("Auth resolution failed; continuing as guest.", authError);
      }
    }

    const body = (await request.json().catch(() => null)) as CouncilRequestBody | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
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

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        {
          error: RESTRICTED_MESSAGE,
            metadata: {
              risk: "CRITICAL" as RiskLevel,
              role,
              vertical: tenantVertical,
              verticalTag: verticalTag(tenantVertical),
              identityProfile,
              creatorStamp,
            },
          },
          { status: 403 }
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
    let generated: { content: string; provider: string };
    try {
      generated = await generateContent({
        prompt,
        tier,
        systemInstruction,
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
    const { content, provider } = generated;
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

    return NextResponse.json(
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
          identityProfile,
          creatorStamp,
        },
      },
      { status: 200 }
    );
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
    },
    example: {
      prompt: "Generate a listing launch brief for this property",
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

