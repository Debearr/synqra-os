import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyInternalRequest } from "@/lib/jobs/internal-auth";
import {
  assertVertical,
  normalizeVertical,
  resolveTenantFromTenantConfig,
  type TenantVertical,
  verticalTag,
} from "@/lib/verticals/tenant";

type GenerateBody = {
  tenant_id?: string;
  vertical?: string;
  request_type?: string;
  prompt?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
};

const DEFAULT_TRAVEL_COMPLIANCE =
  "Prices subject to change. Advisor is not the travel supplier. Final pricing confirmed at booking.";

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/+$/, "") : request.nextUrl.origin;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function resolveTerminologyMap(brandVoice: Record<string, unknown>, vertical: TenantVertical): Record<string, string> {
  const configured = toRecord(brandVoice.terminology_map);
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(configured)) {
    if (typeof value === "string" && value.trim()) {
      map[key] = value.trim();
    }
  }

  if (Object.keys(map).length > 0) {
    return map;
  }
  if (vertical === "travel_advisor") {
    return {
      listing: "itinerary / experience",
      property: "destination",
      price: "starting_from / package_price",
    };
  }
  return {};
}

function resolveComplianceText(brandVoice: Record<string, unknown>, vertical: TenantVertical): string {
  const configured = typeof brandVoice.compliance === "string" ? brandVoice.compliance.trim() : "";
  if (configured) {
    return configured;
  }
  if (vertical === "travel_advisor") {
    return DEFAULT_TRAVEL_COMPLIANCE;
  }
  return "";
}

function appendComplianceText(content: string, complianceText: string): string {
  if (!complianceText) return content;
  if (content.toLowerCase().includes(complianceText.toLowerCase())) {
    return content;
  }
  return `${content}\n\n${complianceText}`.trim();
}

function buildPrompt(input: {
  tenantId: string;
  vertical: TenantVertical;
  tone: string;
  keywords: string[];
  avoid: string[];
  voiceNotes: string;
  platform: string | null;
  terminologyMap: Record<string, string>;
  complianceText: string;
  prompt: string;
}): string {
  const terminologyBlock =
    Object.keys(input.terminologyMap).length > 0
      ? Object.entries(input.terminologyMap)
          .map(([from, to]) => `${from} -> ${to}`)
          .join(", ")
      : "none";

  return [
    `[Tenant: ${input.tenantId}]`,
    `[Vertical: ${input.vertical}]`,
    `[Voice: ${input.tone}]`,
    `[Keywords: ${input.keywords.join(", ")}]`,
    `[Avoid: ${input.avoid.join(", ")}]`,
    `[Terminology Map: ${terminologyBlock}]`,
    `[Compliance: ${input.complianceText || "standard platform compliance"}]`,
    input.voiceNotes ? `Style notes: ${input.voiceNotes}` : "",
    "Output mode: deterministic, trust-first, editorial tone. Avoid chatty phrasing.",
    "Never use misleading claims such as guaranteed, best, cheapest, #1.",
    `Platform: ${input.platform || "general"}`,
    "",
    input.prompt,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as GenerateBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verification = verifyInternalRequest(request, body);
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error || "Unauthorized" }, { status: 401 });
  }

  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
  const requestType = typeof body.request_type === "string" ? body.request_type.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform.trim() : null;
  const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
  const requestedVertical = normalizeVertical(body.vertical);

  if (!tenantId || !requestType || !prompt) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["tenant_id", "request_type", "prompt"],
      },
      { status: 400 }
    );
  }

  const supabase = requireSupabaseAdmin();
  const { data: tenantConfig, error: tenantError } = await supabase
    .from("product_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .maybeSingle();

  if (tenantError || !tenantConfig) {
    return NextResponse.json({ error: "Invalid tenant" }, { status: 400 });
  }

  const tenant = resolveTenantFromTenantConfig(tenantId, tenantConfig);
  try {
    assertVertical(tenant, requestedVertical ?? tenant.vertical);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Vertical mismatch for tenant.",
        details: error instanceof Error ? error.message : "Unknown mismatch",
      },
      { status: 400 }
    );
  }

  const brandVoice = toRecord(tenantConfig.brand_voice);
  const tone = typeof brandVoice.tone === "string" ? brandVoice.tone : "neutral";
  const keywords = toStringArray(brandVoice.keywords);
  const avoid = toStringArray(brandVoice.avoid);
  const voiceNotes = typeof brandVoice.voice_notes === "string" ? brandVoice.voice_notes : "";
  const terminologyMap = resolveTerminologyMap(brandVoice, tenant.vertical);
  const complianceText = resolveComplianceText(brandVoice, tenant.vertical);

  const enrichedPrompt = buildPrompt({
    tenantId,
    vertical: tenant.vertical,
    tone,
    keywords,
    avoid,
    voiceNotes,
    platform,
    terminologyMap,
    complianceText,
    prompt,
  });

  const baseUrl = getBaseUrl(request);
  const councilResponse = await fetch(`${baseUrl}/api/council`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(verification.signature ? { "x-internal-signature": verification.signature } : {}),
    },
    body: JSON.stringify({
      prompt: enrichedPrompt,
      tenant: {
        id: tenant.tenantId,
        vertical: tenant.vertical,
      },
    }),
  });

  if (!councilResponse.ok) {
    return NextResponse.json(
      {
        error: "Generation failed",
        details: await councilResponse.text(),
      },
      { status: councilResponse.status }
    );
  }

  const councilData = (await councilResponse.json().catch(() => null)) as
    | {
        content?: string;
        metadata?: Record<string, unknown>;
      }
    | null;

  const generatedContentRaw = typeof councilData?.content === "string" ? councilData.content : "";
  const generatedContent = appendComplianceText(generatedContentRaw, complianceText);
  const governanceWarnings = Array.isArray(councilData?.metadata?.warnings)
    ? (councilData?.metadata?.warnings as unknown[])
    : [];
  const qualityScore =
    typeof councilData?.metadata?.quality_score === "number" ? (councilData?.metadata?.quality_score as number) : null;

  const { data: loggedRequest } = await supabase
    .from("content_requests")
    .insert({
      tenant_id: tenantId,
      user_id: verification.userId,
      request_type: requestType,
      prompt_input: prompt,
      generated_output: generatedContent,
      quality_score: qualityScore,
      governance_warnings: governanceWarnings,
      platform,
      metadata: {
        ...metadata,
        tenant: {
          id: tenant.tenantId,
          vertical: tenant.vertical,
          vertical_tag: verticalTag(tenant.vertical),
        },
        terminology_map: terminologyMap,
        compliance_text: complianceText || null,
        council_metadata: councilData?.metadata || {},
      },
    })
    .select("id")
    .maybeSingle();

  return NextResponse.json({
    request_id: loggedRequest?.id ?? null,
    tenant_id: tenantId,
    tenant: {
      id: tenant.tenantId,
      vertical: tenant.vertical,
      vertical_tag: verticalTag(tenant.vertical),
    },
    generated_content: generatedContent,
    quality_score: qualityScore,
    governance_warnings: governanceWarnings,
    tone_analysis: {
      detected_tone: tone,
      matches_brand_voice: true,
    },
    metadata: councilData?.metadata || {},
  });
}
