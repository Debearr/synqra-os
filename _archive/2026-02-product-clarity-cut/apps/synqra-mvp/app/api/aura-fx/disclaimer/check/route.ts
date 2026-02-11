import { NextRequest, NextResponse } from "next/server";
import { DisclaimerService, getTriggerMessage } from "../disclaimer-service";
import { getDisclaimerContent } from "@/lib/compliance/disclaimer-manager";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";

/**
 * POST /api/aura-fx/disclaimer/check
 * Check if user needs to acknowledge disclaimer
 */
export async function POST(req: NextRequest) {
  try {
    console.info("[demo] disclaimer check start");
    const authHeader = req.headers.get("authorization");
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }
    const { userId, assessmentType } = body;

    if (!userId || !assessmentType) {
      return NextResponse.json(
        { error: "userId and assessmentType required" },
        { status: 400 }
      );
    }

    const service = new DisclaimerService(authHeader || undefined);
    const timeoutMs = 8000;
    const timeout = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error("Disclaimer check timed out"));
      }, timeoutMs);
    });
    const disclaimerState = await Promise.race([
      service.getDisclaimerState(userId, assessmentType),
      timeout,
    ]);
    console.info("[demo] disclaimer check complete");

    return NextResponse.json({
      requiresAcknowledgment: disclaimerState.requiresAcknowledgment,
      trigger: disclaimerState.trigger,
      version: disclaimerState.version,
      content: disclaimerState.content,
      methodologyContent: disclaimerState.methodologyContent,
      triggerMessage: getTriggerMessage(disclaimerState.trigger),
      lastAcknowledgment: disclaimerState.lastAcknowledgment,
    });
  } catch (error) {
    console.error("Disclaimer check error:", error);
    const fallback = getDisclaimerContent("assessment");
    console.info("[demo] disclaimer check fallback");
    return NextResponse.json({
      requiresAcknowledgment: true,
      trigger: "initial",
      version: "local",
      content: fallback.short,
      methodologyContent: fallback.methodology,
      triggerMessage: getTriggerMessage("initial"),
      lastAcknowledgment: null,
      error: LUXURY_ERROR_MESSAGE,
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
