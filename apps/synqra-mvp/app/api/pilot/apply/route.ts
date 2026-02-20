import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateUserRoleState } from "@/lib/user-role-state";

type PilotApplyBody = {
  name?: unknown;
  company?: unknown;
  website?: unknown;
  business_type?: unknown;
  goal?: unknown;
  desired_outcome?: unknown;
  why_synqra?: unknown;
};

type PilotScore = {
  score: number;
  summary: string;
  source: "openai" | "fallback";
};

function asTrimmedString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function clampScore(input: unknown): number {
  const raw = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(raw)) return 5;
  const rounded = Math.round(raw);
  if (rounded < 1) return 1;
  if (rounded > 10) return 10;
  return rounded;
}

function summarizeFallback(payload: Required<Record<keyof PilotApplyBody, string>>): string {
  return `Application received for ${payload.company}. Goal: ${payload.goal}. Desired outcome: ${payload.desired_outcome}.`;
}

function parseScoringPayload(text: string): { score: number; summary: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const direct = (() => {
    try {
      return JSON.parse(trimmed) as { score?: unknown; summary?: unknown };
    } catch {
      return null;
    }
  })();

  const candidate = direct ?? (() => {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as { score?: unknown; summary?: unknown };
    } catch {
      return null;
    }
  })();

  if (!candidate) return null;
  if (typeof candidate.summary !== "string" || !candidate.summary.trim()) return null;

  return {
    score: clampScore(candidate.score),
    summary: candidate.summary.trim(),
  };
}

async function scoreWithOpenAI(payload: Required<Record<keyof PilotApplyBody, string>>): Promise<PilotScore> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      score: 5,
      summary: summarizeFallback(payload),
      source: "fallback",
    };
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const rubricPrompt = [
    "You are scoring founder pilot applications for B2B software.",
    "Return strict JSON: {\"score\": <integer 1-10>, \"summary\": <string under 220 chars>}.",
    "Scoring rubric:",
    "- Problem clarity and urgency",
    "- ICP fit and business model quality",
    "- Likelihood to execute with Synqra",
    "- Measurable desired outcome",
    "",
    `Name: ${payload.name}`,
    `Company: ${payload.company}`,
    `Website: ${payload.website}`,
    `Business Type: ${payload.business_type}`,
    `Goal: ${payload.goal}`,
    `Desired Outcome: ${payload.desired_outcome}`,
    `Why Synqra: ${payload.why_synqra}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: "Return valid JSON only.",
          },
          {
            role: "user",
            content: rubricPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`OpenAI scoring failed: ${response.status} ${errorText}`);
    }

    const payloadJson = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payloadJson.choices?.[0]?.message?.content ?? "";
    const parsed = parseScoringPayload(content);
    if (!parsed) {
      throw new Error("OpenAI response did not include parseable scoring JSON");
    }

    return {
      score: parsed.score,
      summary: parsed.summary,
      source: "openai",
    };
  } catch (error) {
    console.warn("[pilot/apply] OpenAI scoring fallback:", error);
    return {
      score: 5,
      summary: summarizeFallback(payload),
      source: "fallback",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as PilotApplyBody | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_request_payload",
          message: "Body must be a JSON object",
        },
        { status: 400 }
      );
    }

    const normalized = {
      name: asTrimmedString(body.name),
      company: asTrimmedString(body.company),
      website: asTrimmedString(body.website),
      business_type: asTrimmedString(body.business_type),
      goal: asTrimmedString(body.goal),
      desired_outcome: asTrimmedString(body.desired_outcome),
      why_synqra: asTrimmedString(body.why_synqra),
    };

    const requiredFields = Object.entries(normalized).filter(([, value]) => !value).map(([key]) => key);
    if (requiredFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_fields",
          fields: requiredFields,
        },
        { status: 400 }
      );
    }

    let supabase: Awaited<ReturnType<typeof createClient>>;
    try {
      supabase = await createClient();
    } catch (error) {
      console.error("[pilot/apply] Supabase client error:", error);
      return NextResponse.json({ ok: false, error: "supabase_client_unavailable" }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const scoring = await scoreWithOpenAI(normalized);

    await updateUserRoleState({
      userId: user.id,
      role: "applicant",
      pilotScore: scoring.score,
      pilotSummary: scoring.summary,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          score: scoring.score,
          summary: scoring.summary,
          scoring_source: scoring.source,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[pilot/apply] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

