import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getInternalSigningSecret, verifyInternalRequest } from "@/lib/jobs/internal-auth";
import { signJobPayload } from "@/lib/jobs/job-signature";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag } from "@/lib/verticals/tenant";

type DraftBody = {
  email_event_id?: string;
  tone_preference?: "premium" | "direct" | "casual";
  context?: string;
  include_signature?: boolean;
  vertical?: string;
};

type ToneConfidenceResult = {
  score: number;
  lowConfidence: boolean;
};

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/+$/, "") : request.nextUrl.origin;
}

function getToneConfidence(voiceExampleCount: number, context: string, sentiment: string | null): ToneConfidenceResult {
  let score = 0.3;
  if (voiceExampleCount >= 1) score += 0.2;
  if (voiceExampleCount >= 2) score += 0.2;
  if (voiceExampleCount >= 3) score += 0.1;
  if (context.trim().length >= 20) score += 0.1;
  if ((sentiment || "").trim().length > 0) score += 0.1;
  const normalized = Math.min(1, Number(score.toFixed(2)));
  return {
    score: normalized,
    lowConfidence: normalized < 0.65,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DraftBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalRequest(request, body);
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error || "Unauthorized" }, { status: 401 });
  }

  const emailEventId = typeof body.email_event_id === "string" ? body.email_event_id.trim() : "";
  const tonePreference = body.tone_preference || "direct";
  const context = typeof body.context === "string" ? body.context.trim() : "";
  const includeSignature = body.include_signature !== false;
  const requestedVertical = normalizeVertical(body.vertical);

  if (!emailEventId) {
    return NextResponse.json({ error: "Missing required field: email_event_id" }, { status: 400 });
  }

  const supabase = requireSupabaseAdmin();
  const { data: emailEvent, error: emailError } = await supabase.from("email_events").select("*").eq("id", emailEventId).maybeSingle();

  if (emailError || !emailEvent) {
    return NextResponse.json({ error: "Email event not found" }, { status: 404 });
  }

  const resolvedUserId = verification.userId || (typeof emailEvent.user_id === "string" ? emailEvent.user_id : null);
  if (!resolvedUserId) {
    return NextResponse.json({ error: "Unable to resolve user context" }, { status: 400 });
  }
  const tenant = await resolveTenantForUserId(resolvedUserId);
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

  const { data: voiceExamples } = await supabase
    .from("email_voice_training")
    .select("original_text,tone,context")
    .eq("user_id", resolvedUserId)
    .eq("tone", tonePreference)
    .eq("approved", true)
    .limit(3);

  const voiceContext =
    voiceExamples && voiceExamples.length > 0
      ? `\n\nVoice examples:\n${voiceExamples
          .map((example) => `Context: ${example.context || "N/A"}\n${example.original_text}`)
          .join("\n\n")}`
      : "";

  const confidence = getToneConfidence(voiceExamples?.length ?? 0, context, emailEvent.sentiment ?? null);
  const confidenceGuardrail = confidence.lowConfidence
    ? `
Low confidence mode:
- Keep the reply between 60 and 110 words.
- Acknowledge receipt, clarify one next step, and avoid assumptions.
- Use safer neutral language and avoid commitments not present in the source email.`
    : "";

  const draftPrompt = `Draft a reply in De Bear's voice.

Original Email:
From: ${emailEvent.from_address}
Subject: ${emailEvent.subject}
Body: ${emailEvent.body_preview || ""}

Context: ${context || emailEvent.sentiment || "neutral"}
Tone: ${tonePreference}
Include signature: ${includeSignature ? "yes" : "no"}
${voiceContext}

Requirements:
- No emojis
- No hashtags
- No hype language
- Concise and precise
- Draft only, no sending instructions${confidenceGuardrail}`;

  const baseUrl = getBaseUrl(request);
  const councilResponse = await fetch(`${baseUrl}/api/council`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(verification.signature ? { "x-internal-signature": verification.signature } : {}),
    },
    body: JSON.stringify({
      prompt: draftPrompt,
      tenant: {
        id: tenant.tenantId,
        vertical: tenant.vertical,
      },
    }),
  });

  if (!councilResponse.ok) {
    return NextResponse.json({ error: "Draft generation failed", details: await councilResponse.text() }, { status: 500 });
  }

  const councilData = (await councilResponse.json().catch(() => null)) as
    | {
        content?: string;
        metadata?: Record<string, unknown>;
      }
    | null;

  const draftBody = typeof councilData?.content === "string" ? councilData.content.trim() : "";
  if (!draftBody) {
    return NextResponse.json({ error: "Draft generation returned empty content" }, { status: 500 });
  }

  const internalPayload = {
    userId: resolvedUserId,
    type: "email" as const,
    recipient: emailEvent.from_address,
    subject: emailEvent.subject?.toLowerCase().startsWith("re:") ? emailEvent.subject : `Re: ${emailEvent.subject}`,
    body: draftBody,
    sensitivityLevel: ["high", "critical"].includes(String(emailEvent.priority || "").toLowerCase()) ? "high" : "normal",
    approved: false,
    metadata: {
      source: "api_v1_email_draft",
      emailEventId,
      tonePreference,
      vertical: tenant.vertical,
      vertical_tag: verticalTag(tenant.vertical),
    },
  };

  let queueData: {
    queueId?: string | null;
    draftId?: string | null;
    draftStatus?: string;
  } | null = null;

  const internalSignature = signJobPayload(internalPayload, getInternalSigningSecret());
  const queueResponse = await fetch(`${baseUrl}/api/internal/communications/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-signature": internalSignature,
    },
    body: JSON.stringify(internalPayload),
  });

  queueData = (await queueResponse.json().catch(() => null)) as
    | {
        queueId?: string | null;
        draftId?: string | null;
        draftStatus?: string;
      }
    | null;

  if (!queueResponse.ok) {
    return NextResponse.json(
      {
        error: "Failed to queue draft",
        details: queueData,
      },
      { status: queueResponse.status }
    );
  }

  const { data: storedDraft, error: draftError } = await supabase
    .from("email_drafts")
    .insert({
      email_event_id: emailEventId,
      user_id: resolvedUserId,
      recipient: internalPayload.recipient,
      subject: internalPayload.subject,
      body: draftBody,
      tone_preference: tonePreference,
      approval_status: "pending",
      gmail_draft_id: queueData?.draftId ?? null,
      metadata: {
        queueId: queueData?.queueId ?? null,
        queueDraftStatus: queueData?.draftStatus ?? null,
        vertical: tenant.vertical,
        vertical_tag: verticalTag(tenant.vertical),
        toneConfidenceScore: confidence.score,
        toneConfidenceGuardrailApplied: confidence.lowConfidence,
        councilMetadata: councilData?.metadata || {},
      },
    })
    .select("id")
    .single();

  if (draftError) {
    return NextResponse.json({ error: "Failed to persist email draft", details: draftError.message }, { status: 500 });
  }

  return NextResponse.json({
    draft_id: storedDraft.id,
    email_event_id: emailEventId,
    approval_status: "pending",
    approval_required: internalPayload.sensitivityLevel === "high",
    recipient: internalPayload.recipient,
    subject: internalPayload.subject,
    body: draftBody,
    queue: {
      queue_id: queueData?.queueId ?? null,
      gmail_draft_id: queueData?.draftId ?? null,
      draft_status: queueData?.draftStatus ?? null,
    },
    tone_confidence: {
      score: confidence.score,
      guardrail_applied: confidence.lowConfidence,
    },
  });
}
