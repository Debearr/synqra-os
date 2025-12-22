import { NextRequest, NextResponse } from "next/server";
import { executePipeline } from "../../../engine/pipeline";
import { emulateModelRun } from "../../../engine/model-runner";
import { redactKeys } from "../../../lib/structured-output";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await executePipeline(body, emulateModelRun);

    return NextResponse.json(
      {
        promptId: result.promptId,
        routingModel: result.routingModel,
        fallbackModel: result.fallbackModel,
        output: result.output.data,
        telemetry: {
          usedTokens: result.output.usedTokens,
          latencyMs: result.output.latencyMs,
          traceId: result.output.traceId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const sanitized = redactKeys(error, ["stack", "cause"]);
    return NextResponse.json(
      {
        error: "INTELLIGENCE_PIPELINE_FAILURE",
        message: (error as Error).message,
        detail: sanitized,
      },
      { status: 400 },
    );
  }
}
