import { NextRequest, NextResponse } from "next/server";
import { DisclaimerService, getTriggerMessage } from "../disclaimer-service";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";

/**
 * POST /api/aura-fx/disclaimer/check
 * Check if user needs to acknowledge disclaimer
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const body = await req.json();
    const { userId, assessmentType } = body;

    if (!userId || !assessmentType) {
      return NextResponse.json(
        { error: "userId and assessmentType required" },
        { status: 400 }
      );
    }

    const service = new DisclaimerService(authHeader || undefined);
    const disclaimerState = await service.getDisclaimerState(
      userId,
      assessmentType
    );

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
    return NextResponse.json(
      {
        error: LUXURY_ERROR_MESSAGE,
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
