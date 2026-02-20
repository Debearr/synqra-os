import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/app/api/_shared/admin-access";
import { updateUserRoleState } from "@/lib/user-role-state";

type DenyBody = {
  userId?: unknown;
  adminToken?: unknown;
};

function asTrimmedString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as DenyBody | null;
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

    await updateUserRoleState({
      userId,
      role: "denied",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[pilot/deny] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

