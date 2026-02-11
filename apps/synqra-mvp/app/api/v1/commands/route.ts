import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createGmailDraft } from "@/lib/integrations/google/gmail-drafts";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag, type TenantVertical } from "@/lib/verticals/tenant";

type CommandBody = {
  command?: string;
  input_mode?: "text" | "voice";
  vertical?: string;
};

type EmailEventContext = {
  id: string;
  user_id: string | null;
  from_address: string;
  to_address: string | null;
  subject: string;
  body_preview: string | null;
  priority: string;
  sentiment: string | null;
  created_at: string;
};

type SupportedCommand =
  | { type: "draft_reply"; targetName: string }
  | { type: "summarize_today" };

type CouncilResponse = {
  content?: string;
  consensus?: string;
  responses?: Array<{ response?: string; content?: string }>;
  error?: string;
  message?: string;
};

function parseSupportedCommand(raw: string): SupportedCommand | null {
  const normalized = raw.trim();
  const replyMatch = normalized.match(/^draft a reply to\s+(.+)$/i);
  if (replyMatch?.[1]) {
    return {
      type: "draft_reply",
      targetName: replyMatch[1].trim(),
    };
  }

  if (/^summarize today(?:'s)? emails$/i.test(normalized)) {
    return { type: "summarize_today" };
  }

  return null;
}

function extractAddress(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const bracketMatch = trimmed.match(/<([^>]+)>/);
  if (bracketMatch?.[1] && bracketMatch[1].includes("@")) {
    return bracketMatch[1].trim();
  }

  if (trimmed.includes("@")) {
    return trimmed;
  }

  return null;
}

function extractCouncilContent(payload: CouncilResponse | null): string {
  if (!payload) return "";
  if (typeof payload.content === "string" && payload.content.trim()) return payload.content.trim();
  if (typeof payload.consensus === "string" && payload.consensus.trim()) return payload.consensus.trim();
  const first = payload.responses?.[0];
  if (typeof first?.response === "string" && first.response.trim()) return first.response.trim();
  if (typeof first?.content === "string" && first.content.trim()) return first.content.trim();
  return "";
}

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/+$/, "") : request.nextUrl.origin;
}

function getStartOfTodayUtcIso(): string {
  const now = new Date();
  const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  return startUtc.toISOString();
}

async function resolveUser(
  request: NextRequest
): Promise<{ id: string; email: string | null; vertical: TenantVertical } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;
  const tenant = await resolveTenantForUserId(user.id);
  return { id: user.id, email: user.email ?? null, vertical: tenant.vertical };
}

async function generateWithCouncil(
  request: NextRequest,
  prompt: string,
  vertical: TenantVertical
): Promise<string> {
  const authHeader = request.headers.get("authorization");
  const response = await fetch(`${getBaseUrl(request)}/api/council`, {
    method: "POST",
    headers: authHeader
      ? {
          "Content-Type": "application/json",
          Authorization: authHeader,
        }
      : { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      tenant: {
        id: vertical,
        vertical,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as CouncilResponse | null;
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Council generation failed");
  }

  const content = extractCouncilContent(payload);
  if (!content) {
    throw new Error("Council returned empty content");
  }
  return content;
}

async function handleDraftReplyCommand(
  request: NextRequest,
  inputMode: "text" | "voice",
  user: { id: string; email: string | null; vertical: TenantVertical },
  targetName: string
) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("email_events")
    .select("id,user_id,from_address,to_address,subject,body_preview,priority,sentiment,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to load Gmail context", details: error.message }, { status: 500 });
  }

  const target = targetName.toLowerCase();
  const candidate = ((data || []) as EmailEventContext[]).find((event) => {
    const from = event.from_address.toLowerCase();
    const subject = event.subject.toLowerCase();
    return from.includes(target) || subject.includes(target);
  });

  if (!candidate) {
    return NextResponse.json(
      { error: "No matching email found for contact", target: targetName, suggestion: "Try a more specific name." },
      { status: 404 }
    );
  }

  const recipient = extractAddress(candidate.from_address);
  if (!recipient) {
    return NextResponse.json({ error: "Could not resolve recipient address from Gmail context" }, { status: 400 });
  }

  const { data: voiceExamples } = await supabase
    .from("email_voice_training")
    .select("original_text,tone,context")
    .eq("user_id", user.id)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const tonePreference = ["high", "critical"].includes(candidate.priority.toLowerCase()) ? "premium" : "direct";
  const voiceContext =
    voiceExamples && voiceExamples.length > 0
      ? `\n\nVoice examples:\n${voiceExamples
          .map((example) => `Context: ${example.context || "N/A"}\n${example.original_text}`)
          .join("\n\n")}`
      : "";

  const prompt = `Draft a reply in De Bear's voice.

Original Email:
From: ${candidate.from_address}
Subject: ${candidate.subject}
Body: ${candidate.body_preview || ""}
Priority: ${candidate.priority}
Sentiment: ${candidate.sentiment || "neutral"}

Requirements:
- No emojis
- No hype language
- Keep it concise and specific
- No sending instructions
- Ask one clarifying question only if context is incomplete${voiceContext}`;

  const draftBody = await generateWithCouncil(request, prompt, user.vertical);
  const draftSubject = candidate.subject.toLowerCase().startsWith("re:") ? candidate.subject : `Re: ${candidate.subject}`;
  const draftResult = await createGmailDraft({
    userId: user.id,
    recipient,
    subject: draftSubject,
    body: draftBody,
  });

  if (draftResult.status !== "created") {
    return NextResponse.json(
      {
        error: "Gmail draft creation failed",
        draft_status: draftResult.status,
        reason: "reason" in draftResult ? draftResult.reason : "Unknown reason",
      },
      { status: 424 }
    );
  }

  const { data: savedDraft, error: saveDraftError } = await supabase
    .from("email_drafts")
    .insert({
      email_event_id: candidate.id,
      user_id: user.id,
      recipient,
      subject: draftSubject,
      body: draftBody,
      tone_preference: tonePreference,
      approval_status: "pending",
      gmail_draft_id: draftResult.draftId,
      metadata: {
        source: "api_v1_commands",
        command: `draft a reply to ${targetName}`,
        inputMode,
        vertical: user.vertical,
        vertical_tag: verticalTag(user.vertical),
      },
    })
    .select("id")
    .single();

  if (saveDraftError) {
    return NextResponse.json({ error: "Draft was created but logging failed", details: saveDraftError.message }, { status: 500 });
  }

  await supabase.from("communications_queue").insert({
    user_id: user.id,
    type: "email",
    recipient,
    subject: draftSubject,
    body: draftBody,
    draft_id: draftResult.draftId,
    approval_status: "pending",
    sensitivity_level: ["high", "critical"].includes(candidate.priority.toLowerCase()) ? "high" : "normal",
      metadata: {
        source: "api_v1_commands",
        command: `draft a reply to ${targetName}`,
        inputMode,
        emailEventId: candidate.id,
        vertical: user.vertical,
        vertical_tag: verticalTag(user.vertical),
      },
  });

  return NextResponse.json({
    ok: true,
    command: "draft_reply",
    draft_id: savedDraft.id,
    gmail_draft_id: draftResult.draftId,
    target: targetName,
  });
}

async function handleSummarizeTodayCommand(
  request: NextRequest,
  inputMode: "text" | "voice",
  user: { id: string; email: string | null; vertical: TenantVertical }
) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("email_events")
    .select("id,user_id,from_address,to_address,subject,body_preview,priority,sentiment,created_at")
    .eq("user_id", user.id)
    .gte("created_at", getStartOfTodayUtcIso())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load today's email context", details: error.message }, { status: 500 });
  }

  const events = (data || []) as EmailEventContext[];
  if (events.length === 0) {
    return NextResponse.json({ error: "No email events found for today" }, { status: 404 });
  }

  const eventLines = events
    .slice(0, 60)
    .map((event, index) => {
      return `${index + 1}. ${event.subject} | Priority: ${event.priority} | From: ${event.from_address} | Notes: ${
        event.body_preview || "No preview"
      }`;
    })
    .join("\n");

  const prompt = `Summarize today's emails.

Output constraints:
- Max 1 to 1.5 pages
- Bullet points only
- Explain acronyms clearly
- No emojis
- No hype language
- Plain English

Email context:
${eventLines}`;

  const digestBody = await generateWithCouncil(request, prompt, user.vertical);
  const recipient =
    user.email ||
    extractAddress(events.find((event) => Boolean(event.to_address))?.to_address) ||
    extractAddress(events[0]?.from_address);

  if (!recipient) {
    return NextResponse.json({ error: "Could not resolve recipient for digest draft" }, { status: 400 });
  }

  const digestSubject = `Daily Email Summary - ${new Date().toISOString().slice(0, 10)}`;
  const draftResult = await createGmailDraft({
    userId: user.id,
    recipient,
    subject: digestSubject,
    body: digestBody,
  });

  if (draftResult.status !== "created") {
    return NextResponse.json(
      {
        error: "Gmail draft creation failed",
        draft_status: draftResult.status,
        reason: "reason" in draftResult ? draftResult.reason : "Unknown reason",
      },
      { status: 424 }
    );
  }

  const { data: queueRow, error: queueError } = await supabase
    .from("communications_queue")
    .insert({
      user_id: user.id,
      type: "email",
      recipient,
      subject: digestSubject,
      body: digestBody,
      draft_id: draftResult.draftId,
      approval_status: "pending",
      sensitivity_level: "normal",
      metadata: {
        source: "api_v1_commands",
        command: "summarize today's emails",
        inputMode,
        eventCount: events.length,
        vertical: user.vertical,
        vertical_tag: verticalTag(user.vertical),
      },
    })
    .select("id")
    .single();

  if (queueError) {
    return NextResponse.json({ error: "Digest draft created but queue logging failed", details: queueError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    command: "summarize_today",
    queue_id: queueRow.id,
    gmail_draft_id: draftResult.draftId,
    event_count: events.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as CommandBody | null;
    if (!body?.command || typeof body.command !== "string") {
      return NextResponse.json({ error: "Missing command text" }, { status: 400 });
    }

    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requestedVertical = normalizeVertical(body.vertical);
    try {
      assertVertical(
        { tenantId: user.id, vertical: user.vertical, source: "user_metadata" },
        requestedVertical ?? user.vertical
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: "Vertical mismatch for user.",
          details: error instanceof Error ? error.message : "Unknown mismatch",
        },
        { status: 400 }
      );
    }

    const parsed = parseSupportedCommand(body.command);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Unsupported command",
          supported: ["Draft a reply to [Name]", "Summarize today's emails"],
        },
        { status: 400 }
      );
    }

    const inputMode: "text" | "voice" = body.input_mode === "voice" ? "voice" : "text";
    if (parsed.type === "draft_reply") {
      return await handleDraftReplyCommand(request, inputMode, user, parsed.targetName);
    }

    return await handleSummarizeTodayCommand(request, inputMode, user);
  } catch (error) {
    return NextResponse.json(
      { error: "Command execution failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/commands",
    supported_commands: ["Draft a reply to [Name]", "Summarize today's emails"],
    input_modes: ["text", "voice"],
    behavior: "Outputs are saved as Gmail drafts only",
  });
}
