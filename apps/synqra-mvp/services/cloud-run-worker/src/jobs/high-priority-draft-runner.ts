import { generateEmailDraft } from "../adapters/router-client.js";
import { listDecryptedRefreshTokens } from "../adapters/google-token-store.js";
import { getSupabaseClient } from "../adapters/supabase.js";

type HighPriorityDraftResult = {
  scanned: number;
  drafted: number;
  skippedExisting: number;
  skippedMissingUser: number;
  skippedConnectorDisabled: number;
  failed: number;
};

type EmailEventRow = {
  id: string;
  user_id: string | null;
  priority: string;
  sentiment: string | null;
  subject: string | null;
  from_address: string | null;
};

type DraftApiResponse = {
  draft_id?: string;
  queue?: {
    gmail_draft_id?: string | null;
    draft_status?: string | null;
  };
};

export async function runHighPriorityDraftRunner(): Promise<HighPriorityDraftResult> {
  const supabase = getSupabaseClient();
  const tokens = await listDecryptedRefreshTokens();
  if (tokens.length === 0) {
    throw new Error("No Google OAuth tokens configured for draft generation");
  }
  const { data, error } = await supabase
    .from("email_events")
    .select("id,user_id,priority,sentiment,subject,from_address")
    .in("priority", ["high", "critical"])
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Failed to query high-priority email events: ${error.message}`);
  }

  const events = (data || []) as EmailEventRow[];
  const result: HighPriorityDraftResult = {
    scanned: events.length,
    drafted: 0,
    skippedExisting: 0,
    skippedMissingUser: 0,
    skippedConnectorDisabled: 0,
    failed: 0,
  };

  for (const event of events) {
    if (!event.user_id) {
      result.skippedMissingUser += 1;
      continue;
    }

    const { data: existingDraft, error: draftLookupError } = await supabase
      .from("email_drafts")
      .select("id")
      .eq("email_event_id", event.id)
      .limit(1)
      .maybeSingle();

    if (draftLookupError) {
      result.failed += 1;
      continue;
    }

    if (existingDraft?.id) {
      result.skippedExisting += 1;
      continue;
    }

    try {
      const tonePreference = event.priority.toLowerCase() === "critical" ? "premium" : "direct";
      const draftResponse = (await generateEmailDraft({
        userId: event.user_id,
        email_event_id: event.id,
        tone_preference: tonePreference,
        context: `Priority: ${event.priority}. Sentiment: ${event.sentiment || "neutral"}.`,
        include_signature: true,
      })) as DraftApiResponse;

      const draftStatus = draftResponse.queue?.draft_status || null;
      const gmailDraftId = draftResponse.queue?.gmail_draft_id || null;

      if (draftStatus === "skipped" || draftStatus === "failed" || !gmailDraftId) {
        result.skippedConnectorDisabled += 1;
        continue;
      }

      result.drafted += 1;
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
