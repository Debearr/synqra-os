import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/app/api/_shared/admin-access";
import { normalizeEmail } from "@/app/api/_shared/access-codes";
import { sendAdminNotification, sendApplicantConfirmation } from "@/lib/email/notifications";

type InternalEmailTestBody = {
  adminToken?: string;
  applicantEmail?: string;
  fullName?: string;
  companyName?: string;
  role?: string;
  companySize?: string;
  linkedinProfile?: string;
  whyPilot?: string;
};

function isBodyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrDefault(value: unknown, fallbackValue: string): string {
  if (typeof value !== "string") return fallbackValue;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallbackValue;
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    const payload = body as InternalEmailTestBody;
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

    const applicantEmail = normalizeEmail(stringOrDefault(payload.applicantEmail, ""));
    if (!isEmailLike(applicantEmail)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_applicant_email",
          message: "applicantEmail must be a valid email address",
          requestId,
        },
        { status: 400 }
      );
    }

    const fullName = stringOrDefault(payload.fullName, "Synqra Email Test");
    const companyName = stringOrDefault(payload.companyName, "Synqra Internal QA");
    const role = stringOrDefault(payload.role, "Founder");
    const companySize = stringOrDefault(payload.companySize, "1-10");
    const whyPilot = stringOrDefault(
      payload.whyPilot,
      `Deterministic internal email verification run (${new Date().toISOString()})`
    );
    const linkedinProfile =
      typeof payload.linkedinProfile === "string" && payload.linkedinProfile.trim().length > 0
        ? payload.linkedinProfile.trim()
        : undefined;

    await Promise.all([
      sendApplicantConfirmation({
        fullName,
        email: applicantEmail,
        companyName,
        role,
        companySize,
        linkedinProfile,
        whyPilot,
      }),
      sendAdminNotification({
        fullName,
        email: applicantEmail,
        companyName,
        role,
        companySize,
        linkedinProfile,
        whyPilot,
      }),
    ]);

    console.info("[Internal Email Test] applicant and admin notifications sent", {
      requestId,
      applicantEmail,
    });

    return NextResponse.json({
      ok: true,
      requestId,
      data: {
        applicantEmail,
      },
    });
  } catch (error) {
    console.error("[Internal Email Test] email send failed", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
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
}
