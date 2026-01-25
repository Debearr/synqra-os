import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInternalSignedRequest } from "@/lib/jobs/internal-auth";
import { logTelemetryEvent } from "@/lib/telemetry/firebase-events";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag, type TenantVertical } from "@/lib/verticals/tenant";

type OutcomeRecordRequest = {
  userId: string;
  jobId?: string;
  eventType: string;
  status: string;
  metadata?: Record<string, unknown>;
  platform?: string;
  outcomeClassification?: string;
  vertical?: string;
};

const telemetryEventMap: Record<string, "content_created" | "content_approved" | "content_scheduled" | "content_published"> = {
  created: "content_created",
  approved: "content_approved",
  scheduled: "content_scheduled",
  published: "content_published",
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function extractRequestedVertical(body: OutcomeRecordRequest): TenantVertical | null {
  const direct = normalizeVertical(body.vertical);
  if (direct) return direct;
  const metadata = toRecord(body.metadata);
  const nested = normalizeVertical(metadata?.vertical);
  if (nested) return nested;
  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as OutcomeRecordRequest | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalSignedRequest(request, body);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }

  if (!body.userId || !body.eventType || !body.status) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["userId", "eventType", "status"],
      },
      { status: 400 }
    );
  }

  const supabase = requireSupabaseAdmin();
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

  const { data, error } = await supabase
    .from("outcome_events")
    .insert({
      user_id: body.userId,
      job_id: body.jobId ?? null,
      event_type: body.eventType,
      status: body.status,
      metadata: {
        ...(body.metadata ?? {}),
        vertical: tenant.vertical,
        vertical_tag: verticalTag(tenant.vertical),
      },
      platform: body.platform ?? null,
      outcome_classification: body.outcomeClassification ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to record outcome event",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const telemetryName = telemetryEventMap[body.eventType.toLowerCase()];
  if (telemetryName) {
    void logTelemetryEvent(telemetryName, {
      vertical: tenant.vertical,
      verticalTag: verticalTag(tenant.vertical),
      outcomeEventId: data.id,
      jobId: body.jobId ?? null,
      status: body.status,
      platform: body.platform ?? null,
      outcomeClassification: body.outcomeClassification ?? null,
    }).catch(() => undefined);
  }

  return NextResponse.json(
    {
      ok: true,
      outcomeEventId: data.id,
      vertical: tenant.vertical,
      vertical_tag: verticalTag(tenant.vertical),
    },
    { status: 202 }
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
