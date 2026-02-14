import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { hashAccessCode, normalizeEmail, type AccessCodeRole } from "@/app/api/_shared/access-codes";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

type AccessCodeRow = {
  id: string;
  email: string;
  role: AccessCodeRole;
  expires_at: string;
  used_at: string | null;
};

function isBodyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidCodeResponse(requestId: string) {
  return NextResponse.json(
    {
      ok: false,
      error: "invalid_or_expired_code",
      message: "Code is invalid, expired, or already used",
      requestId,
    },
    { status: 401 }
  );
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    if (!isBodyObject(body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_request_payload",
          message: "Body must be a JSON object",
          requestId,
        },
        { status: 400 }
      );
    }

    const rawEmail = typeof body.email === "string" ? body.email : "";
    const rawCode = typeof body.code === "string" ? body.code : "";
    const email = normalizeEmail(rawEmail);
    const code = rawCode.trim().toUpperCase();

    if (!email || !code) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_fields",
          message: "email and code are required",
          requestId,
        },
        { status: 400 }
      );
    }

    const codeHash = hashAccessCode(code);
    const nowIso = new Date().toISOString();
    const supabaseAdmin = requireSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("access_codes")
      .select("id, email, role, expires_at, used_at")
      .eq("email", email)
      .eq("code_hash", codeHash)
      .maybeSingle();

    if (lookupError) {
      console.error("[Access Verify] lookup failed", {
        requestId,
        email,
        error: lookupError.message,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "database_lookup_failed",
          requestId,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      console.warn("[Access Verify] invalid code (no matching record)", {
        requestId,
        email,
      });
      return invalidCodeResponse(requestId);
    }

    const existingRecord = existing as AccessCodeRow;
    if (existingRecord.used_at) {
      console.warn("[Access Verify] code already used", {
        requestId,
        email,
        accessCodeId: existingRecord.id,
      });
      return invalidCodeResponse(requestId);
    }

    if (new Date(existingRecord.expires_at).getTime() <= Date.now()) {
      console.warn("[Access Verify] code expired", {
        requestId,
        email,
        accessCodeId: existingRecord.id,
      });
      return invalidCodeResponse(requestId);
    }

    const consumedAt = new Date().toISOString();
    const { data: consumed, error: consumeError } = await supabaseAdmin
      .from("access_codes")
      .update({ used_at: consumedAt })
      .eq("id", existingRecord.id)
      .is("used_at", null)
      .gt("expires_at", consumedAt)
      .select("id, email, role, expires_at, used_at")
      .maybeSingle();

    if (consumeError) {
      console.error("[Access Verify] consume failed", {
        requestId,
        email,
        accessCodeId: existingRecord.id,
        error: consumeError.message,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "database_update_failed",
          requestId,
        },
        { status: 500 }
      );
    }

    if (!consumed) {
      console.warn("[Access Verify] code could not be consumed", {
        requestId,
        email,
        accessCodeId: existingRecord.id,
      });
      return invalidCodeResponse(requestId);
    }

    const consumedRecord = consumed as AccessCodeRow;

    console.info("[Access Verify] code consumed", {
      requestId,
      email,
      role: consumedRecord.role,
      accessCodeId: consumedRecord.id,
      usedAt: consumedRecord.used_at,
    });

    return NextResponse.json({
      ok: true,
      requestId,
      data: {
        email: consumedRecord.email,
        role: consumedRecord.role,
        verifiedAt: consumedRecord.used_at,
        gate: {
          accessGranted: true,
          nextPath: "/auth/sign-up",
        },
      },
    });
  } catch (error) {
    console.error("[Access Verify] unexpected error", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        requestId,
      },
      { status: 500 }
    );
  }
}
