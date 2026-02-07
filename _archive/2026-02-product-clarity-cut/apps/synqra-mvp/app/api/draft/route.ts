import { NextRequest, NextResponse } from "next/server";
import { generatePerfectDraft, type DraftIntent } from "@/lib/draftEngine";
import {
  enforceSynqraLiteDraftSecurity,
  PublicGatekeeperError,
  type SynqraTier,
} from "@/lib/security/gatekeeper";

type DraftRequest = {
  prompt: string;
  intent?: DraftIntent;
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DraftRequest;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const intent = body?.intent;
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Invalid request", message: "Field 'prompt' is required." },
        { status: 400 }
      );
    }

    // Synqra Lite security + limits (premium users bypass by tier/auth headers)
    const tierHeader = (request.headers.get("x-synqra-tier") || "").toLowerCase();
    const tier: SynqraTier =
      tierHeader === "premium" || tierHeader === "enterprise" ? (tierHeader as SynqraTier) : "free";
    const fingerprint = request.headers.get("x-synqra-fp");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent");
    const authHeader = request.headers.get("authorization");
    const effectiveTier: SynqraTier = authHeader ? "premium" : tier;

    enforceSynqraLiteDraftSecurity({
      tier: effectiveTier,
      fingerprint,
      email: email || request.headers.get("x-synqra-email"),
      ip,
      userAgent,
    });

    const draft = await generatePerfectDraft(prompt, intent);
    return NextResponse.json(
      {
        draft,
        intent: intent ?? "draft",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PublicGatekeeperError) {
      return NextResponse.json(
        { error: "Synqra Lite limit", message: error.message },
        { status: error.status }
      );
    }

    console.error("[/api/draft] error", error);
    return NextResponse.json(
      {
        error: "Draft generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/draft",
    method: "POST",
    description: "Generate a single executive-grade draft from a prompt",
    requiredFields: ["prompt"],
    optionalFields: ["intent"],
    intents: ["draft", "rewrite", "summary", "email"],
    example: { prompt: "Write a LinkedIn post about...", intent: "draft" },
  });
}


