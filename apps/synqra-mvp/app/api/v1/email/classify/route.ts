import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInternalRequest } from "@/lib/jobs/internal-auth";
import {
  assertVertical,
  normalizeVertical,
  resolveTenantForUserId,
  resolveTenantFromTenantConfig,
  type TenantVertical,
  verticalTag,
} from "@/lib/verticals/tenant";

type ClassifyBody = {
  vertical?: string;
  gmail_message_id?: string;
  gmail_thread_id?: string | null;
  from?: string;
  to?: string | null;
  subject?: string;
  body_preview?: string;
  received_at?: string;
};

type ParsedClassification = {
  priority: string;
  email_type: string;
  reasoning: string;
  suggested_labels: string[];
  requires_signature: boolean;
  sentiment: string;
};

const DEFAULT_LABELS: Record<TenantVertical, string[]> = {
  realtor: ["listing_inquiry", "buyer_lead", "seller_lead", "investor_inquiry"],
  travel_advisor: ["honeymoon_inquiry", "destination_question", "itinerary_request", "group_travel"],
};

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/+$/, "") : request.nextUrl.origin;
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function parseClassification(content: unknown): ParsedClassification {
  const fallback: ParsedClassification = {
    priority: "normal",
    email_type: "transactional",
    reasoning: "Fallback classification applied",
    suggested_labels: [],
    requires_signature: false,
    sentiment: "neutral",
  };

  const raw = typeof content === "string" ? content.trim() : "";
  if (!raw) return fallback;

  const candidates = [raw];
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(raw.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      const labels = Array.isArray(parsed.suggested_labels)
        ? parsed.suggested_labels.filter((item): item is string => typeof item === "string")
        : [];

      return {
        priority: typeof parsed.priority === "string" ? parsed.priority : fallback.priority,
        email_type: typeof parsed.email_type === "string" ? parsed.email_type : fallback.email_type,
        reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : fallback.reasoning,
        suggested_labels: labels,
        requires_signature: Boolean(parsed.requires_signature),
        sentiment: typeof parsed.sentiment === "string" ? parsed.sentiment : fallback.sentiment,
      };
    } catch {
      continue;
    }
  }

  return fallback;
}

async function resolveLabelTaxonomy(vertical: TenantVertical): Promise<string[]> {
  const supabase = requireSupabaseAdmin();
  const { data: configs, error } = await supabase
    .from("product_configs")
    .select("tenant_id, platform_rules, brand_voice")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !configs) {
    return DEFAULT_LABELS[vertical];
  }

  const config =
    configs.find((candidate) => {
      const tenantId = typeof candidate.tenant_id === "string" ? candidate.tenant_id : "";
      if (!tenantId) return false;
      const tenant = resolveTenantFromTenantConfig(tenantId, candidate);
      return tenant.vertical === vertical;
    }) ?? null;

  if (!config) {
    return DEFAULT_LABELS[vertical];
  }

  const platformRules = toRecord(config?.platform_rules);
  const labelsFromRules = Array.isArray(platformRules.email_labels)
    ? platformRules.email_labels.filter((item): item is string => typeof item === "string")
    : [];
  if (labelsFromRules.length > 0) {
    return labelsFromRules;
  }

  const brandVoice = toRecord(config?.brand_voice);
  const labelsFromVoice = Array.isArray(brandVoice.email_labels)
    ? brandVoice.email_labels.filter((item): item is string => typeof item === "string")
    : [];
  if (labelsFromVoice.length > 0) {
    return labelsFromVoice;
  }

  return DEFAULT_LABELS[vertical];
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ClassifyBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalRequest(request, body);
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error || "Unauthorized" }, { status: 401 });
  }

  const gmailMessageId = typeof body.gmail_message_id === "string" ? body.gmail_message_id.trim() : "";
  const from = typeof body.from === "string" ? body.from.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const bodyPreview = typeof body.body_preview === "string" ? body.body_preview.trim() : "";
  const requestedVertical = normalizeVertical(body.vertical);

  if (!gmailMessageId || !from || !subject) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["gmail_message_id", "from", "subject"],
      },
      { status: 400 }
    );
  }

  const resolvedUserId = verification.userId;
  let vertical: TenantVertical = requestedVertical ?? "realtor";
  if (resolvedUserId) {
    const tenant = await resolveTenantForUserId(resolvedUserId);
    vertical = tenant.vertical;
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
    vertical = requestedVertical ?? tenant.vertical;
  }

  const supabase = requireSupabaseAdmin();
  const { data: existing } = await supabase
    .from("email_events")
    .select("id,priority,email_type")
    .eq("gmail_message_id", gmailMessageId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      email_event_id: existing.id,
      classification: {
        priority: existing.priority,
        email_type: existing.email_type,
        cached: true,
      },
    });
  }

  const advisorLabels = await resolveLabelTaxonomy(vertical);
  const classificationPrompt = `Classify this email with zero assumptions.

Vertical: ${vertical}
Use only this taxonomy: ${advisorLabels.join(", ")}

From: ${from}
Subject: ${subject}
Preview: ${bodyPreview}

Return strict JSON:
{
  "priority": "spam|junk|low|normal|high|critical",
  "email_type": "newsletter|promotional|transactional|important|critical_hitl|personal",
  "reasoning": "brief explanation",
  "suggested_labels": ["..."],
  "requires_signature": false,
  "sentiment": "positive|neutral|urgent|frustrated"
}`;

  const baseUrl = getBaseUrl(request);
  const councilResponse = await fetch(`${baseUrl}/api/council`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(verification.signature ? { "x-internal-signature": verification.signature } : {}),
    },
    body: JSON.stringify({
      prompt: classificationPrompt,
      tenant: {
        id: vertical,
        vertical,
      },
    }),
  });

  if (!councilResponse.ok) {
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }

  const councilData = (await councilResponse.json().catch(() => null)) as { content?: unknown } | null;
  const parsed = parseClassification(councilData?.content);

  const { data: emailEvent, error: insertError } = await supabase
    .from("email_events")
    .insert({
      user_id: resolvedUserId,
      gmail_message_id: gmailMessageId,
      gmail_thread_id: body.gmail_thread_id ?? null,
      from_address: from,
      to_address: body.to ?? null,
      subject,
      body_preview: bodyPreview || null,
      received_at: body.received_at ?? null,
      priority: parsed.priority,
      email_type: parsed.email_type,
      suggested_labels: parsed.suggested_labels,
      requires_signature: parsed.requires_signature,
      sentiment: parsed.sentiment,
      classified_at: new Date().toISOString(),
      metadata: {
        vertical,
        vertical_tag: verticalTag(vertical),
        advisor_labels: advisorLabels,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Storage failed", details: insertError.message }, { status: 500 });
  }

  const shouldNotify = ["high", "critical"].includes(parsed.priority.toLowerCase());

  return NextResponse.json({
    email_event_id: emailEvent.id,
    vertical,
    vertical_tag: verticalTag(vertical),
    classification: {
      priority: parsed.priority,
      email_type: parsed.email_type,
      confidence: 0.85,
      reasoning: parsed.reasoning,
    },
    suggested_labels: parsed.suggested_labels,
    requires_signature: parsed.requires_signature,
    sentiment: parsed.sentiment,
    notification_sent: shouldNotify,
  });
}
