import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { runPennyAuraSignalFlow } from "@/lib/penny/signals-admin";
import { assertPennyEnabledOrThrow, verifyPennyInternalAccess } from "@/lib/penny/security";

export const runtime = "nodejs";

const bodySchema = z.object({
  ownerId: z.string().uuid(),
  pair: z.string().min(1),
  timeframe: z.string().min(1),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  const verification = verifyPennyInternalAccess(request, body);
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: verification.error }, { status: verification.status });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  }

  try {
    assertPennyEnabledOrThrow();

    const result = await runPennyAuraSignalFlow({
      ownerId: parsed.data.ownerId,
      pair: parsed.data.pair,
      timeframe: parsed.data.timeframe,
      source: parsed.data.source,
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run Penny signal pipeline",
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
