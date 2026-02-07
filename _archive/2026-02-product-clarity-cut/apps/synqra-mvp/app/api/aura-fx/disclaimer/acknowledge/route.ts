import { NextRequest, NextResponse } from "next/server";
import { DisclaimerService } from "../disclaimer-service";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";

/**
 * POST /api/aura-fx/disclaimer/acknowledge
 * Record user disclaimer acknowledgment
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const body = await req.json();
    const { userId, version, trigger } = body;

    if (!userId || !version || !trigger) {
      return NextResponse.json(
        { error: "userId, version, and trigger required" },
        { status: 400 }
      );
    }

    const service = new DisclaimerService(authHeader || undefined);
    const acknowledgmentId = await service.recordAcknowledgment(
      userId,
      version,
      trigger
    );

    return NextResponse.json({
      success: true,
      acknowledgmentId,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Disclaimer acknowledgment error:", error);
    return NextResponse.json(
      {
        error: LUXURY_ERROR_MESSAGE,
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
