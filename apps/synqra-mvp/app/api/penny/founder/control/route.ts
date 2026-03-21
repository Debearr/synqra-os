import { NextRequest, NextResponse } from "next/server";

import { getPennyRuntimeConfigSummary } from "@/lib/penny/config";
import { resolvePennyControlState, verifyPennyFounderAccess } from "@/lib/penny/security";

export const runtime = "nodejs";

type ControlRequestBody = {
  action?: unknown;
  founderToken?: unknown;
  shutdownToken?: unknown;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const founderAccess = verifyPennyFounderAccess(request);
  if (!founderAccess.ok) {
    return NextResponse.json({ ok: false, error: founderAccess.error }, { status: founderAccess.status });
  }

  return NextResponse.json(
    {
      ok: true,
      control: {
        ...resolvePennyControlState(),
        ...getPennyRuntimeConfigSummary(),
        actionsStubbed: ["pause", "resume", "shutdown"],
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ControlRequestBody | null;
  const action = asTrimmedString(body?.action);

  if (!action || !["pause", "resume", "shutdown"].includes(action)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid control action",
        allowedActions: ["pause", "resume", "shutdown"],
      },
      { status: 400 }
    );
  }

  const founderAccess = verifyPennyFounderAccess(request, {
    bodyFounderToken: asTrimmedString(body?.founderToken),
    bodyShutdownToken: asTrimmedString(body?.shutdownToken),
    requireShutdownToken: action === "shutdown",
  });

  if (!founderAccess.ok) {
    return NextResponse.json({ ok: false, error: founderAccess.error }, { status: founderAccess.status });
  }

  return NextResponse.json(
    {
      ok: false,
      accepted: false,
      action,
      message: "Penny control actions are not enabled in Block 3. Use PENNY_ENABLED for fail-closed startup control.",
    },
    { status: 501 }
  );
}

