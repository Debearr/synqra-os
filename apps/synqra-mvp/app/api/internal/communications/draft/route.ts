import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInternalSignedRequest } from "@/lib/jobs/internal-auth";
import { createGmailDraft } from "@/lib/integrations/google/gmail-drafts";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag, type TenantVertical } from "@/lib/verticals/tenant";

type CommunicationDraftRequest = {
  userId: string;
  type: "email" | "calendar";
  recipient: string;
  subject?: string;
  body?: string;
  sensitivityLevel?: "low" | "normal" | "high";
  approved?: boolean;
  metadata?: Record<string, unknown>;
  vertical?: string;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function extractRequestedVertical(body: CommunicationDraftRequest): TenantVertical | null {
  const direct = normalizeVertical(body.vertical);
  if (direct) return direct;
  const metadata = toRecord(body.metadata);
  const nested = normalizeVertical(metadata?.vertical);
  if (nested) return nested;
  return null;
}

function requiresSensitiveApproval(): boolean {
  return (process.env.SENSITIVE_ACTION_APPROVAL_REQUIRED || "true").toLowerCase() !== "false";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CommunicationDraftRequest | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalSignedRequest(request, body);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }

  if (!body.userId || !body.type || !body.recipient) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["userId", "type", "recipient"],
      },
      { status: 400 }
    );
  }

  const sensitivityLevel = body.sensitivityLevel ?? "normal";
  const requiresApprovalBeforeDraft = sensitivityLevel === "high" && body.type !== "email";
  if (requiresApprovalBeforeDraft && requiresSensitiveApproval() && !body.approved) {
    return NextResponse.json(
      {
        error: "High-sensitivity communications require explicit approval before draft creation",
      },
      { status: 403 }
    );
  }

  let draftId: string | null = null;
  let draftStatus: "created" | "skipped" | "failed" = "skipped";
  let draftReason: string | null = null;
  const tenant = await resolveTenantForUserId(body.userId);
  const requestedVertical = extractRequestedVertical(body);
  try {
    assertVertical(tenant, requestedVertical ?? tenant.vertical);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Vertical mismatch for user.",
        details: error instanceof Error ? error.message : "Unknown mismatch",
      },
      { status: 400 }
    );
  }

  if (body.type === "email") {
    const draftResult = await createGmailDraft({
      userId: body.userId,
      recipient: body.recipient,
      subject: body.subject ?? "",
      body: body.body ?? "",
    });

    draftId = draftResult.draftId;
    draftStatus = draftResult.status;
    draftReason = "reason" in draftResult ? draftResult.reason : null;
  }

  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("communications_queue")
    .insert({
      user_id: body.userId,
      type: body.type,
      recipient: body.recipient,
      subject: body.subject ?? null,
      body: body.body ?? null,
      draft_id: draftId,
      approval_status: "pending",
      sensitivity_level: sensitivityLevel,
      metadata: {
        ...(body.metadata ?? {}),
        vertical: tenant.vertical,
        vertical_tag: verticalTag(tenant.vertical),
        draftStatus,
        draftReason,
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to create communications queue entry",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      queueId: data.id,
      approvalStatus: "pending",
      draftStatus,
      draftId,
      draftReason,
      vertical: tenant.vertical,
      vertical_tag: verticalTag(tenant.vertical),
    },
    { status: 202 }
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
