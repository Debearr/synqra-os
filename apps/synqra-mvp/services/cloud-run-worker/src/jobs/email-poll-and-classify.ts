import {
  applyLabelsToMessage,
  ensureLabels,
  exchangeRefreshTokenForAccessToken,
  getMessageMetadata,
  listUnreadMessageIds,
} from "../adapters/gmail.js";
import { listDecryptedRefreshTokens } from "../adapters/google-token-store.js";
import { getSupabaseClient } from "../adapters/supabase.js";

type Priority = "spam" | "low" | "normal" | "high" | "critical";
type ProductLabel = "SYNQRA/" | "NOID/" | "AURAFX/" | "AURAFX-SIGNALS/" | "PERSONAL/";

type Classification = {
  priority: Priority;
  emailType: string;
  reasoning: string;
  suggestedLabels: string[];
  requiresSignature: boolean;
  sentiment: "positive" | "neutral" | "urgent" | "frustrated";
  productLabel: ProductLabel;
};

type EmailPollResult = {
  usersScanned: number;
  unreadFetched: number;
  inserted: number;
  duplicates: number;
  labelApplied: number;
  silent: number;
  failures: number;
};

const REQUIRED_LABELS = ["@Synqra Office", "SYNQRA/", "NOID/", "AURAFX/", "AURAFX-SIGNALS/", "PERSONAL/"] as const;

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeAddressValue(value: string): string {
  return value.trim().toLowerCase();
}

function resolveProductLabel(context: string): ProductLabel {
  if (containsAny(context, ["aurafx-signals", "signal alert", "signal", "forex alert", "fx signal"])) {
    return "AURAFX-SIGNALS/";
  }
  if (containsAny(context, ["aurafx", "forex", "fx", "trading"])) {
    return "AURAFX/";
  }
  if (containsAny(context, ["noid", "creative", "campaign", "brand"])) {
    return "NOID/";
  }
  if (containsAny(context, ["mom", "dad", "family", "birthday", "personal"])) {
    return "PERSONAL/";
  }
  return "SYNQRA/";
}

function classifyEmail(input: { from: string; to: string; subject: string; snippet: string }): Classification {
  const context = normalizeAddressValue(`${input.from} ${input.to} ${input.subject} ${input.snippet}`);

  const spamKeywords = [
    "unsubscribe",
    "buy now",
    "limited time offer",
    "free gift",
    "winner",
    "casino",
    "crypto pump",
    "earn $$$",
  ];
  const lowKeywords = ["newsletter", "digest", "weekly update", "promotion", "promotional", "sale", "coupon"];
  const criticalKeywords = [
    "critical",
    "wire transfer",
    "bank account",
    "security breach",
    "production down",
    "outage",
    "legal notice",
    "suspend account",
    "fraud",
    "immediately",
  ];
  const highKeywords = ["urgent", "asap", "deadline", "tomorrow", "contract", "invoice due", "proposal", "follow-up"];

  const productLabel = resolveProductLabel(context);

  if (containsAny(context, spamKeywords)) {
    return {
      priority: "spam",
      emailType: "promotional",
      reasoning: "Spam/promo keywords detected",
      suggestedLabels: [productLabel],
      requiresSignature: false,
      sentiment: "neutral",
      productLabel,
    };
  }

  if (containsAny(context, criticalKeywords)) {
    return {
      priority: "critical",
      emailType: "critical_hitl",
      reasoning: "Critical risk or operational disruption indicators detected",
      suggestedLabels: [productLabel, "@Synqra Office"],
      requiresSignature: true,
      sentiment: "urgent",
      productLabel,
    };
  }

  if (containsAny(context, highKeywords)) {
    return {
      priority: "high",
      emailType: "important",
      reasoning: "Time-sensitive or commitment-related language detected",
      suggestedLabels: [productLabel, "@Synqra Office"],
      requiresSignature: false,
      sentiment: "urgent",
      productLabel,
    };
  }

  if (containsAny(context, lowKeywords)) {
    return {
      priority: "low",
      emailType: "newsletter",
      reasoning: "Low-priority informational/promotional pattern detected",
      suggestedLabels: [productLabel],
      requiresSignature: false,
      sentiment: "neutral",
      productLabel,
    };
  }

  return {
    priority: "normal",
    emailType: "transactional",
    reasoning: "No urgent or spam indicators detected",
    suggestedLabels: [productLabel],
    requiresSignature: false,
    sentiment: "neutral",
    productLabel,
  };
}

function classifyEmailWithFallback(input: { from: string; to: string; subject: string; snippet: string }): Classification {
  try {
    return classifyEmail(input);
  } catch {
    return {
      priority: "normal",
      emailType: "transactional",
      reasoning: "Classification failed; defaulted to normal",
      suggestedLabels: ["SYNQRA/"],
      requiresSignature: false,
      sentiment: "neutral",
      productLabel: "SYNQRA/",
    };
  }
}

export async function runEmailPollAndClassify(): Promise<EmailPollResult> {
  const supabase = getSupabaseClient();
  const tokens = await listDecryptedRefreshTokens();
  if (tokens.length === 0) {
    throw new Error("No Google OAuth tokens configured for worker ingestion");
  }
  const result: EmailPollResult = {
    usersScanned: tokens.length,
    unreadFetched: 0,
    inserted: 0,
    duplicates: 0,
    labelApplied: 0,
    silent: 0,
    failures: 0,
  };

  for (const token of tokens) {
    try {
      const accessToken = await exchangeRefreshTokenForAccessToken(token.refreshToken);
      const labelMap = await ensureLabels(accessToken, [...REQUIRED_LABELS]);
      const messageIds = await listUnreadMessageIds(accessToken, "is:unread");
      result.unreadFetched += messageIds.length;

      for (const messageId of messageIds) {
        try {
          const { data: existing } = await supabase
            .from("email_events")
            .select("id")
            .eq("gmail_message_id", messageId)
            .maybeSingle();

          if (existing?.id) {
            result.duplicates += 1;
            continue;
          }

          const metadata = await getMessageMetadata(accessToken, messageId);
          const classification = classifyEmailWithFallback({
            from: metadata.from,
            to: metadata.to,
            subject: metadata.subject,
            snippet: metadata.snippet,
          });

          const labelsToApply = new Set<string>();
          labelsToApply.add(classification.productLabel);
          if (classification.priority === "high" || classification.priority === "critical") {
            labelsToApply.add("@Synqra Office");
          } else if (classification.priority === "spam" || classification.priority === "low") {
            result.silent += 1;
          }

          const labelIds = Array.from(labelsToApply)
            .map((name) => labelMap[name])
            .filter((id): id is string => Boolean(id));
          if (labelIds.length > 0) {
            await applyLabelsToMessage(accessToken, metadata.id, labelIds);
            result.labelApplied += 1;
          }

          const { error: insertError } = await supabase.from("email_events").insert({
            user_id: token.userId,
            gmail_message_id: metadata.id,
            gmail_thread_id: metadata.threadId,
            from_address: metadata.from || "unknown",
            to_address: metadata.to || null,
            subject: metadata.subject || "(no subject)",
            body_preview: metadata.snippet || null,
            received_at: metadata.receivedAt,
            priority: classification.priority,
            email_type: classification.emailType,
            suggested_labels: Array.from(labelsToApply),
            requires_signature: classification.requiresSignature,
            sentiment: classification.sentiment,
            classified_at: new Date().toISOString(),
            metadata: {
              reasoning: classification.reasoning,
              source: "cloud-run-worker/email-poll-and-classify",
            },
          });

          if (insertError) {
            if (insertError.code === "23505") {
              result.duplicates += 1;
              continue;
            }
            throw new Error(insertError.message);
          }

          result.inserted += 1;
        } catch {
          result.failures += 1;
        }
      }
    } catch {
      result.failures += 1;
    }
  }

  return result;
}
