import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

type RiskLevel = "BASELINE" | "ELEVATED" | "CRITICAL";

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
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

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

  if (trimmed.length > 2000) {
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

const buildFallbackContent = (prompt: string): string => {
  return [
    `Goal: ${prompt}`,
    "",
    "1) Problem validation",
    "Interview 10-15 target users and capture exact pain language before building more scope.",
    "",
    "2) Fast MVP test",
    "Ship one narrow workflow that solves one painful job-to-be-done and measure completion rate.",
    "",
    "3) Success criteria",
    "Track activation, week-1 retention, and willingness-to-pay signals from real users.",
    "",
    "4) Next action",
    "Run a 7-day test plan with one hypothesis, one metric, and one stop/continue decision."
  ].join("\n");
};

const generateCouncilContent = async (prompt: string): Promise<{ content: string; provider: string }> => {
  const providerErrors: string[] = [];
  const systemInstruction =
    "You are Synqra Council. Provide practical, concise guidance with clear next steps and measurable checks.";

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (isConfiguredKey(openRouterApiKey)) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          temperature: 0.3,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
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
        return { content, provider: "openrouter" };
      }
      throw new Error("OpenRouter returned empty content");
    } catch (error) {
      providerErrors.push(error instanceof Error ? error.message : "OpenRouter call failed");
    }
  }

  const geminiApiKey = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].find(
    isConfiguredKey
  );
  if (geminiApiKey) {
    try {
      const client = new GoogleGenerativeAI(geminiApiKey);
      const model = client.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent([
        systemInstruction,
        "",
        `Prompt: ${prompt}`,
      ]);
      const content = result.response.text().trim();
      if (content) {
        return { content, provider: "gemini" };
      }
      throw new Error("Gemini returned empty content");
    } catch (error) {
      providerErrors.push(error instanceof Error ? error.message : "Gemini call failed");
    }
  }

  console.warn("Council provider fallback active.", providerErrors);
  return { content: buildFallbackContent(prompt), provider: "fallback" };
};

/**
 * POST /api/council
 * Single council decision endpoint for the studio demo flow.
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let role = "guest";
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
        }
      } catch (authError) {
        console.warn("Council auth resolution failed; continuing as guest.", authError);
      }
    }

    const body = await request.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

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
          },
        },
        { status: 403 }
      );
    }

    const compliance = evaluateCompliance(prompt);
    if (!compliance.allowed) {
      return NextResponse.json(
        {
          error: compliance.reason,
          metadata: {
            risk: compliance.risk,
            role,
          },
        },
        { status: 403 }
      );
    }

    const requestId = `council_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const { content, provider } = await generateCouncilContent(prompt);

    return NextResponse.json(
      {
        content,
        consensus: content,
        responses: [
          {
            member: {
              model: provider,
              name: "Synqra Council",
              role: "Decision Advisor",
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
          provider,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI Council API error:", error);
    return NextResponse.json(
      {
        error: "Council query failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/council
 * Returns information about the council endpoint and available members
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/council",
    method: "POST",
    description: "Single council decision endpoint for studio demo flow",
    requestSchema: {
      prompt: "string (required) - The prompt for council evaluation",
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

