import { NextResponse } from "next/server";
import { getAiSpendSummary, getBudgetStatus } from "@/lib/ai-router";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [summary, budget] = await Promise.all([
      getAiSpendSummary(),
      getBudgetStatus(),
    ]);

    return NextResponse.json({
      budget,
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI spend summary error:", error);
    return NextResponse.json(
      {
        error: "Failed to load AI spend summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
