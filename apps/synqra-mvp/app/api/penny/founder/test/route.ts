import { NextRequest, NextResponse } from "next/server";

import { buildPennyFounderOperationalReadiness } from "@/lib/penny/operational-readiness";
import { verifyPennyFounderAccess } from "@/lib/penny/security";

export const runtime = "nodejs";

function asTrimmedString(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const founderAccess = verifyPennyFounderAccess(request);
  if (!founderAccess.ok) {
    return NextResponse.json({ ok: false, error: founderAccess.error }, { status: founderAccess.status });
  }

  try {
    const url = new URL(request.url);
    const report = await buildPennyFounderOperationalReadiness({
      pair: asTrimmedString(url.searchParams.get("pair")),
      timeframe: asTrimmedString(url.searchParams.get("timeframe")),
    });

    return NextResponse.json(
      {
        ok: true,
        report,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to build Penny founder test report",
      },
      { status: 500 }
    );
  }
}
