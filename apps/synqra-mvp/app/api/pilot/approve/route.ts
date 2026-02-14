import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/app/api/_shared/admin-access";
import {
  calculateAccessCodeExpiry,
  generateAccessCode,
  hashAccessCode,
  maskAccessCode,
  normalizeEmail,
  type AccessCodeRole,
} from "@/app/api/_shared/access-codes";
import { sendPilotAccessCodeAdminNotification, sendPilotAccessCodeEmail } from "@/lib/email/access-code";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_INSERT_ATTEMPTS = 3;

type ApprovePilotBody = {
  adminToken?: string;
  applicationId?: string;
  email?: string;
  role?: AccessCodeRole;
  returnCode?: boolean;
};

type PilotApplicationRow = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type AccessCodeInsertRow = {
  id: string;
  expires_at: string;
};

function isAccessCodeRole(value: unknown): value is AccessCodeRole {
  return value === "user" || value === "admin";
}

function isBodyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolvePilotApplication(
  applicationId: string | undefined,
  email: string | undefined
): Promise<PilotApplicationRow | null> {
  const supabaseAdmin = requireSupabaseAdmin();

  if (!applicationId && !email) {
    return null;
  }

  const query = supabaseAdmin
    .from("pilot_applications")
    .select("id, email, full_name, status, reviewed_at, reviewed_by")
    .limit(1);

  const { data, error } = applicationId
    ? await query.eq("id", applicationId).maybeSingle()
    : await query.eq("email", normalizeEmail(email ?? "")).maybeSingle();

  if (error) {
    throw new Error(`Pilot lookup failed: ${error.message}`);
  }

  return (data as PilotApplicationRow | null) ?? null;
}

async function rollbackAccessCodeInsert(accessCodeId: string, requestId: string): Promise<void> {
  const supabaseAdmin = requireSupabaseAdmin();
  const { error } = await supabaseAdmin.from("access_codes").delete().eq("id", accessCodeId);
  if (error) {
    console.error("[Pilot Approve] rollback access code insert failed", {
      requestId,
      accessCodeId,
      error: error.message,
    });
  }
}

async function rollbackPilotStatus(
  application: Pick<PilotApplicationRow, "id" | "status" | "reviewed_at" | "reviewed_by">,
  requestId: string
): Promise<void> {
  const supabaseAdmin = requireSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("pilot_applications")
    .update({
      status: application.status,
      reviewed_at: application.reviewed_at,
      reviewed_by: application.reviewed_by,
    })
    .eq("id", application.id);

  if (error) {
    console.error("[Pilot Approve] rollback pilot status failed", {
      requestId,
      applicationId: application.id,
      error: error.message,
    });
  }
}

export async function POST(request: NextRequest) {
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

    const payload = body as ApprovePilotBody;

    const adminAccess = verifyAdminAccess(request, { bodyToken: payload.adminToken ?? null });
    if (!adminAccess.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: adminAccess.error,
          requestId,
        },
        { status: adminAccess.status }
      );
    }

    const applicationId = typeof payload.applicationId === "string" ? payload.applicationId.trim() : "";
    const emailLookup = typeof payload.email === "string" ? payload.email.trim() : "";

    if (!applicationId && !emailLookup) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_identifier",
          message: "Provide applicationId or email",
          requestId,
        },
        { status: 400 }
      );
    }

    if (payload.role && !isAccessCodeRole(payload.role)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_role",
          message: "role must be 'user' or 'admin'",
          requestId,
        },
        { status: 400 }
      );
    }

    const application = await resolvePilotApplication(applicationId || undefined, emailLookup || undefined);
    if (!application) {
      return NextResponse.json(
        {
          ok: false,
          error: "application_not_found",
          requestId,
        },
        { status: 404 }
      );
    }

    const role: AccessCodeRole = payload.role ?? "user";
    const email = normalizeEmail(application.email);
    const expiresAt = calculateAccessCodeExpiry();
    const supabaseAdmin = requireSupabaseAdmin();

    let insertResult: { record: AccessCodeInsertRow; rawCode: string } | null = null;
    for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt += 1) {
      const rawCode = generateAccessCode();
      const codeHash = hashAccessCode(rawCode);
      const { data, error } = await supabaseAdmin
        .from("access_codes")
        .insert({
          code_hash: codeHash,
          email,
          role,
          expires_at: expiresAt,
        })
        .select("id, expires_at")
        .single();

      if (error) {
        if ((error as { code?: string }).code === "23505" && attempt < MAX_INSERT_ATTEMPTS) {
          continue;
        }
        console.error("[Pilot Approve] access code insert failed", {
          requestId,
          applicationId: application.id,
          email,
          error: error.message,
        });
        return NextResponse.json(
          {
            ok: false,
            error: "access_code_insert_failed",
            requestId,
          },
          { status: 500 }
        );
      }

      insertResult = {
        record: data as AccessCodeInsertRow,
        rawCode,
      };
      break;
    }

    if (!insertResult) {
      return NextResponse.json(
        {
          ok: false,
          error: "access_code_generation_failed",
          requestId,
        },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("pilot_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: "admin_token",
      })
      .eq("id", application.id);

    if (updateError) {
      await rollbackAccessCodeInsert(insertResult.record.id, requestId);
      console.error("[Pilot Approve] application update failed", {
        requestId,
        applicationId: application.id,
        error: updateError.message,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "application_update_failed",
          requestId,
        },
        { status: 500 }
      );
    }

    try {
      await Promise.all([
        sendPilotAccessCodeEmail({
          applicationId: application.id,
          email,
          fullName: application.full_name,
          code: insertResult.rawCode,
          expiresAt: insertResult.record.expires_at,
          role,
        }),
        sendPilotAccessCodeAdminNotification({
          applicationId: application.id,
          email,
          fullName: application.full_name,
          code: insertResult.rawCode,
          expiresAt: insertResult.record.expires_at,
          role,
        }),
      ]);
    } catch (emailError) {
      await rollbackAccessCodeInsert(insertResult.record.id, requestId);
      await rollbackPilotStatus(application, requestId);

      console.error("[Pilot Approve] email dispatch failed", {
        requestId,
        applicationId: application.id,
        email,
        error: emailError instanceof Error ? emailError.message : "Unknown error",
      });
      return NextResponse.json(
        {
          ok: false,
          error: "email_send_failed",
          requestId,
        },
        { status: 502 }
      );
    }

    console.info("[Pilot Approve] access code issued", {
      requestId,
      applicationId: application.id,
      email,
      role,
      codePreview: maskAccessCode(insertResult.rawCode),
      expiresAt: insertResult.record.expires_at,
    });

    const responseData: Record<string, unknown> = {
      applicationId: application.id,
      email,
      role,
      expiresAt: insertResult.record.expires_at,
      codePreview: maskAccessCode(insertResult.rawCode),
    };

    if (payload.returnCode === true && process.env.NODE_ENV !== "production") {
      responseData.accessCode = insertResult.rawCode;
    }

    return NextResponse.json({
      ok: true,
      requestId,
      data: responseData,
    });
  } catch (error) {
    console.error("[Pilot Approve] unexpected error", {
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
