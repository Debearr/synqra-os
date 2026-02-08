import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

type RiskLevel = "BASELINE" | "ELEVATED" | "CRITICAL";

const ALLOWED_ROLES = new Set(["authenticated", "demo", "member", "admin", "owner"]);
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

/**
 * POST /api/council
 * Single council decision endpoint for the studio demo flow.
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const role = toRole(user);
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
    const consensus = `Council review complete for: ${prompt.slice(0, 240)}`;

    return NextResponse.json(
      {
        consensus,
        responses: [
          {
            member: {
              model: "synqra-council",
              name: "Synqra Council",
              role: "Decision Advisor",
            },
            response: consensus,
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

