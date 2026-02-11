import {
  createInternalCommunicationDraft,
  generateCouncilContent,
} from "../adapters/router-client.js";
import {
  exchangeRefreshTokenForAccessToken,
  getPrimaryEmailAddress,
} from "../adapters/gmail.js";
import { listDecryptedRefreshTokens } from "../adapters/google-token-store.js";
import { getSupabaseClient } from "../adapters/supabase.js";

type DigestJobResult = {
  usersScanned: number;
  draftsCreated: number;
  skippedNoEvents: number;
  skippedExistingDigest: number;
  skippedNoRecipient: number;
  failed: number;
};

type EmailEventRow = {
  user_id: string | null;
  from_address: string | null;
  to_address: string | null;
  subject: string | null;
  body_preview: string | null;
  received_at: string | null;
};

function buildFallbackDigest(events: EmailEventRow[], digestDate: string): string {
  const lines: string[] = [];
  lines.push(`Daily Normal Email Digest (${digestDate})`);
  lines.push("");
  lines.push("Summary:");
  lines.push(`- Total normal-priority messages: ${events.length}`);
  lines.push("- This digest is informational and requires manual follow-up.");
  lines.push("");
  lines.push("Messages:");

  events.slice(0, 20).forEach((event, index) => {
    lines.push(
      `- ${index + 1}. ${event.subject || "(no subject)"} | From: ${event.from_address || "unknown"} | Notes: ${
        event.body_preview || "No preview available"
      }`
    );
  });

  lines.push("");
  lines.push("Acronym notes:");
  lines.push("- KPI: Key Performance Indicator.");
  lines.push("- ROI: Return on Investment.");
  lines.push("- SLA: Service Level Agreement.");
  lines.push("- FYI: For Your Information.");
  return lines.join("\n");
}

async function generateDigestBody(userId: string, events: EmailEventRow[], digestDate: string): Promise<string> {
  const eventLines = events
    .slice(0, 40)
    .map((event, index) => {
      const receivedAt = event.received_at || "unknown";
      const subject = event.subject || "(no subject)";
      const from = event.from_address || "unknown";
      const preview = event.body_preview || "No preview available";
      return `${index + 1}. [${receivedAt}] Subject: ${subject} | From: ${from} | Preview: ${preview}`;
    })
    .join("\n");

  const prompt = `Create a daily email digest from normal-priority messages.

Output rules:
- Max 1 to 1.5 pages
- Bullet points only
- Explain acronyms when they first appear
- Plain professional language
- No emojis
- No hype language

User ID: ${userId}
Date: ${digestDate}

Messages:
${eventLines}`;

  const councilData = (await generateCouncilContent({
    userId,
    prompt,
  })) as { content?: unknown };
  const content = typeof councilData?.content === "string" ? councilData.content.trim() : "";
  if (!content) {
    return buildFallbackDigest(events, digestDate);
  }
  return content;
}

function getDigestDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runDailyNormalDigest(): Promise<DigestJobResult> {
  const supabase = getSupabaseClient();
  const digestDate = getDigestDate();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: normalEvents, error: eventError } = await supabase
    .from("email_events")
    .select("user_id,from_address,to_address,subject,body_preview,received_at")
    .eq("priority", "normal")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (eventError) {
    throw new Error(`Failed to query normal email events: ${eventError.message}`);
  }

  const grouped = new Map<string, EmailEventRow[]>();
  for (const row of (normalEvents || []) as EmailEventRow[]) {
    if (!row.user_id) continue;
    const existing = grouped.get(row.user_id) || [];
    existing.push(row);
    grouped.set(row.user_id, existing);
  }

  const refreshTokens = await listDecryptedRefreshTokens();
  if (refreshTokens.length === 0) {
    throw new Error("No Google OAuth tokens configured for daily digest drafting");
  }
  const refreshTokenByUser = new Map<string, string>();
  for (const token of refreshTokens) {
    refreshTokenByUser.set(token.userId, token.refreshToken);
  }

  const result: DigestJobResult = {
    usersScanned: grouped.size,
    draftsCreated: 0,
    skippedNoEvents: 0,
    skippedExistingDigest: 0,
    skippedNoRecipient: 0,
    failed: 0,
  };

  for (const [userId, events] of grouped) {
    if (events.length === 0) {
      result.skippedNoEvents += 1;
      continue;
    }

    const { data: existingDigest, error: existingDigestError } = await supabase
      .from("communications_queue")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "email")
      .contains("metadata", { source: "daily_normal_digest", digestDate })
      .limit(1)
      .maybeSingle();

    if (existingDigestError) {
      result.failed += 1;
      continue;
    }

    if (existingDigest?.id) {
      result.skippedExistingDigest += 1;
      continue;
    }

    let recipient = events.find((item) => Boolean(item.to_address && item.to_address.includes("@")))?.to_address || null;
    const refreshToken = refreshTokenByUser.get(userId) || null;
    if (refreshToken) {
      try {
        const accessToken = await exchangeRefreshTokenForAccessToken(refreshToken);
        recipient = await getPrimaryEmailAddress(accessToken);
      } catch {
        // Use fallback recipient resolution from event data when profile lookup fails.
      }
    }

    if (!recipient) {
      result.skippedNoRecipient += 1;
      continue;
    }

    try {
      const digestBody = await generateDigestBody(userId, events, digestDate);
      const subject = `Daily Normal Email Digest - ${digestDate}`;
      const queueData = (await createInternalCommunicationDraft({
        userId,
        type: "email",
        recipient,
        subject,
        body: digestBody,
        sensitivityLevel: "normal",
        approved: false,
        metadata: {
          source: "daily_normal_digest",
          digestDate,
          eventCount: events.length,
        },
      })) as { draftStatus?: string };

      if (queueData.draftStatus === "created") {
        result.draftsCreated += 1;
      } else {
        result.skippedNoRecipient += 1;
      }
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
