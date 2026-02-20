import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyAdminAccess } from "@/app/api/_shared/admin-access";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { updateUserRoleState } from "@/lib/user-role-state";

type ApproveBody = {
  userId?: unknown;
  adminToken?: unknown;
};

function asTrimmedString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function sendApprovalEmail(userId: string): Promise<void> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) {
    console.warn("[pilot/approve] Email skipped: could not resolve user email", {
      userId,
      error: error?.message ?? "missing email",
    });
    return;
  }

  const email = data.user.email;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.NOTIFICATIONS_FROM_EMAIL?.trim() ||
    process.env.FROM_EMAIL?.trim() ||
    "notifications@synqra.co";

  if (!resendApiKey) {
    console.log(`[pilot/approve] Approval email fallback: ${email}`);
    return;
  }

  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Synqra pilot approval",
    text: "Your Synqra pilot access has been approved. You can now continue to your dashboard.",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ApproveBody | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: "invalid_request_payload" }, { status: 400 });
    }

    const adminAccess = verifyAdminAccess(request, { bodyToken: asTrimmedString(body.adminToken) || null });
    if (!adminAccess.ok) {
      return NextResponse.json({ ok: false, error: adminAccess.error }, { status: adminAccess.status });
    }

    const userId = asTrimmedString(body.userId);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    await updateUserRoleState({
      userId,
      role: "approved_pilot",
      pilotApprovedAt: nowIso,
    });

    try {
      await sendApprovalEmail(userId);
    } catch (emailError) {
      console.warn("[pilot/approve] Approval email dispatch failed:", emailError);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[pilot/approve] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

