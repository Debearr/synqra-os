export type DraftIntent = "draft" | "rewrite" | "summary" | "email";

const openerByIntent: Record<DraftIntent, string> = {
  draft: "Perfect Draft (first pass):",
  rewrite: "Perfect Draft (rewrite):",
  summary: "Perfect Draft (summary):",
  email: "Perfect Draft (email):",
};

const closingStatements: Record<DraftIntent, string> = {
  email: "Adjust the sign-off to match your voice, then send.",
  summary: "This summary keeps clarity, relevance, and momentum.",
  rewrite: "This rewrite is tightened for executive clarity and forward motion.",
  draft: "Review for accuracy, then publish with confidence.",
};

const keywordIntentMap: Record<string, DraftIntent> = {
  email: "email",
  inbox: "email",
  outreach: "email",
  summarize: "summary",
  summary: "summary",
  recap: "summary",
  rewrite: "rewrite",
  polish: "rewrite",
  clean: "rewrite",
};

const sentenceTerminators = /[.!?]+$/;

const capitalise = (value: string) => {
  if (!value) return value;
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const detectIntent = (prompt: string): DraftIntent => {
  const lower = prompt.toLowerCase();
  for (const [keyword, intent] of Object.entries(keywordIntentMap)) {
    if (lower.includes(keyword)) {
      return intent;
    }
  }
  return "draft";
};

const splitIntoSentences = (text: string): string[] => {
  return text
    .split(/\n+/)
    .flatMap((block) => block.split(/[.!?](?=\s|$)/))
    .map((piece) => piece.trim())
    .filter(Boolean);
};

const enrichSentence = (sentence: string, index: number): string => {
  const trimmed = sentence.replace(/["'`]/g, "").trim();
  if (!trimmed) return "";
  const emphasised = capitalise(trimmed);
  if (sentenceTerminators.test(emphasised)) {
    return emphasised;
  }
  const suffix = index % 3 === 0 ? "." : index % 3 === 1 ? " —" : ":";
  const enhancer = index % 3 === 0 ? "" : "";
  return `${emphasised}${suffix}${enhancer}`.replace(/[:—]$/, ".");
};

const craftEmail = (sentences: string[]): string => {
  const subjectSource = sentences[0] ?? "Strategic Update";
  const subject = subjectSource
    .split(" ")
    .slice(0, 8)
    .map((word) => capitalise(word))
    .join(" ");
  const intro = "Hi there,";
  const body = sentences
    .map((s) => `• ${capitalise(s)}`)
    .join("\n");
  const closing = "Warm regards,\nSynqra Draft Engine";
  return `Subject: ${subject}\n\n${intro}\n\n${body}\n\n${closing}`;
};

const craftSummary = (sentences: string[]): string => {
  const headline = sentences[0] ? capitalise(sentences[0]) : "Key Takeaways";
  const bullets = sentences.slice(1).map((s) => `- ${capitalise(s)}`);
  const main = bullets.length ? bullets.join("\n") : "- Core idea distilled with executive clarity.";
  return `${headline}\n\n${main}`;
};

const craftRewrite = (sentences: string[]): string => {
  const body = sentences
    .map((s, idx) => {
      const base = capitalise(s);
      const enhancer = idx % 2 === 0 ? " with a confident, assured tone." : " ensuring the message feels premium.";
      return `${base}${sentenceTerminators.test(base) ? "" : "."}${enhancer}`;
    })
    .join("\n\n");
  return body || "The message has been rewritten for precision, poise, and immediate deployment.";
};

const craftDefault = (sentences: string[]): string => {
  if (!sentences.length) {
    return "Your idea now reads with clarity, intent, and forward momentum. Add any extra detail and regenerate for a tighter fit.";
  }
  return sentences
    .map((s, idx) => {
      const base = capitalise(s);
      if (sentenceTerminators.test(base)) return base;
      return idx === sentences.length - 1 ? `${base}.` : `${base};`;
    })
    .join(" ");
};

const composeFromIntent = (intent: DraftIntent, sentences: string[]): string => {
  switch (intent) {
    case "email":
      return craftEmail(sentences);
    case "summary":
      return craftSummary(sentences);
    case "rewrite":
      return craftRewrite(sentences);
    default:
      return craftDefault(sentences);
  }
};

const ensureLength = (content: string, prompt: string): string => {
  if (content.replace(/\s+/g, "").length >= 20) {
    return content;
  }
  const fallback = `${content} This draft transforms "${prompt.trim()}" into a message that feels deliberate, premium, and fully articulated.`;
  return fallback;
};

export const generatePerfectDraft = async (prompt: string, intentOverride?: DraftIntent): Promise<string> => {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  const intent = intentOverride ?? detectIntent(cleaned);
  const sentences = splitIntoSentences(cleaned).map(enrichSentence).filter(Boolean);
  const body = composeFromIntent(intent, sentences);
  const opener = openerByIntent[intent] ?? openerByIntent.draft;
  const closing = closingStatements[intent] ?? closingStatements.draft;
  const combined = `${opener}\n\n${body}\n\n${closing}`;
  const assured = ensureLength(combined, cleaned);
  return assured;
};
