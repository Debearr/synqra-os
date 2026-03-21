import { NextRequest, NextResponse } from "next/server";

import { getPennyRuntimeConfigSummary } from "@/lib/penny/config";
import { resolvePennyControlState, verifyPennyFounderAccess } from "@/lib/penny/security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const founderAccess = verifyPennyFounderAccess(request);
  if (!founderAccess.ok) {
    return NextResponse.json({ ok: false, error: founderAccess.error }, { status: founderAccess.status });
  }

  return NextResponse.json(
    {
      ok: true,
      penny: {
        ...getPennyRuntimeConfigSummary(),
        ...resolvePennyControlState(),
      },
    },
    { status: 200 }
  );
}

