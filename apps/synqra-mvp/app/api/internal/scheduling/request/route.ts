import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInternalSignedRequest } from "@/lib/jobs/internal-auth";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag, type TenantVertical } from "@/lib/verticals/tenant";

type SchedulingRequestBody = {
  userId: string;
  contentId: string;
  platform: string;
  scheduledTime: string;
  metadata?: Record<string, unknown>;
  vertical?: string;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function extractRequestedVertical(body: SchedulingRequestBody): TenantVertical | null {
  const direct = normalizeVertical(body.vertical);
  if (direct) return direct;
  const metadata = toRecord(body.metadata);
  const nested = normalizeVertical(metadata?.vertical);
  if (nested) return nested;
  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SchedulingRequestBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalSignedRequest(request, body);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }

  if (!body.userId || !body.contentId || !body.platform || !body.scheduledTime) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["userId", "contentId", "platform", "scheduledTime"],
      },
      { status: 400 }
    );
  }

  const scheduledAt = new Date(body.scheduledTime);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledTime" }, { status: 400 });
  }

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

  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("scheduling_requests")
    .insert({
      user_id: body.userId,
      content_id: body.contentId,
      platform: body.platform,
      scheduled_time: scheduledAt.toISOString(),
      approval_status: "pending",
      metadata: {
        ...(body.metadata ?? {}),
        vertical: tenant.vertical,
        vertical_tag: verticalTag(tenant.vertical),
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to create scheduling request",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requestId: data.id,
      approvalStatus: "pending",
      vertical: tenant.vertical,
      vertical_tag: verticalTag(tenant.vertical),
    },
    { status: 202 }
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
