import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInternalSignedRequest } from "@/lib/jobs/internal-auth";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag, type TenantVertical } from "@/lib/verticals/tenant";

type EnqueueRequest = {
  userId: string;
  jobType: string;
  payload: Record<string, unknown>;
  scheduledTime?: string;
  idempotencyKey: string;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function extractRequestedVertical(payload: Record<string, unknown>): TenantVertical | null {
  const direct = normalizeVertical(payload.vertical);
  if (direct) return direct;
  const tenant = toRecord(payload.tenant);
  const nested = normalizeVertical(tenant?.vertical);
  if (nested) return nested;
  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as EnqueueRequest | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalSignedRequest(request, body);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }

  if (!body.userId || !body.jobType || !body.idempotencyKey || !body.payload || typeof body.payload !== "object") {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["userId", "jobType", "payload", "idempotencyKey"],
      },
      { status: 400 }
    );
  }

  const scheduledTime = body.scheduledTime ? new Date(body.scheduledTime) : new Date();
  if (Number.isNaN(scheduledTime.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledTime" }, { status: 400 });
  }

  const tenant = await resolveTenantForUserId(body.userId);
  const requestedVertical = extractRequestedVertical(body.payload);
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
    .from("background_job_runs")
    .insert({
      user_id: body.userId,
      job_type: body.jobType,
      status: "pending",
      payload: {
        ...body.payload,
        vertical: tenant.vertical,
        vertical_tag: verticalTag(tenant.vertical),
      },
      scheduled_time: scheduledTime.toISOString(),
      retry_count: 0,
      idempotency_key: body.idempotencyKey,
      metadata: {
        vertical: tenant.vertical,
        vertical_tag: verticalTag(tenant.vertical),
      },
    })
    .select("id")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      {
        error: status === 409 ? "Duplicate idempotency key" : "Failed to enqueue job",
        details: error.message,
      },
      { status }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      jobId: data.id,
      status: "pending",
      vertical: tenant.vertical,
      vertical_tag: verticalTag(tenant.vertical),
    },
    { status: 202 }
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
