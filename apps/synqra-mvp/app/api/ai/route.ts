import { NextRequest, NextResponse } from "next/server";
import {
  routeAiRequest,
  type AiRouterRequest,
  AiRouterError,
} from "@/lib/ai-router";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AiRouterRequest;
    const { task, prompt, userId, metadata } = body;

    if (!task || !prompt) {
      return NextResponse.json(
        { error: "task and prompt are required" },
        { status: 400 }
      );
    }

    const response = await routeAiRequest({ task, prompt, userId, metadata });
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AiRouterError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status }
      );
    }

    console.error("AI router error:", error);
    return NextResponse.json(
      {
        error: "AI router failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/ai",
    method: "POST",
    description: "AuraFX AI router entrypoint",
    requiredFields: ["task", "prompt"],
    optionalFields: ["userId", "metadata"],
  });
}
