import { z } from "zod";

export type Platform = "linkedin" | "instagram_carousel";

export type IntentClass =
  | "promote"
  | "inquiries"
  | "authority"
  | "educate"
  | "showcase"
  | "announce";

export type VerticalPreset = "luxury_realtor" | "travel_advisor";

export type Intake = {
  platform: Platform;
  raw_ip: string;
  q1_about: string;
  q2_why: string;
  q3_who: string;
  objective_chip: IntentClass;
  vertical: VerticalPreset;
  user_id?: string;
  listing_facts?: Record<string, string | number | boolean>;
};

export type UserVoiceProfile = {
  pov: "i" | "we" | "brand";
  cadence_range: {
    minWordsPerSentence: number;
    maxWordsPerSentence: number;
  };
  phrase_whitelist?: string[];
  banned_phrase_additions?: string[];
};

export type Envelope = {
  platform: Platform;
  intent_class: IntentClass;
  skeleton_sections: Record<string, unknown>;
  draft_text: string;
  validation_report: {
    pass: boolean;
    issues: string[];
  };
  next_action: "deliver" | "ask_micro_question";
  micro_question?: string;
};

export type AuthorityMarkerCategory = "location" | "segment" | "offer_detail";

const HARDENED_REQUEST_SCHEMA = z.object({
  platform: z.enum(["linkedin", "instagram_carousel"]),
  raw_ip: z.string().min(1),
  q1_about: z.string().default(""),
  q2_why: z.string().default(""),
  q3_who: z.string().default(""),
  objective_chip: z.enum(["promote", "inquiries", "authority", "educate", "showcase", "announce"]),
  vertical: z.enum(["luxury_realtor", "travel_advisor"]),
  user_id: z.string().optional(),
  listing_facts: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const URL_PATTERN = /^https?:\/\//i;
const WORD_SPLIT_PATTERN = /\s+/;

const LOCATION_PATTERNS: RegExp[] = [
  /\b[A-Z][a-z]+,\s?[A-Z]{2}\b/,
  /\b(?:in|across|serving|based in|from)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/,
  /\b(?:manhattan|miami|beverly hills|aspen|hamptons|malibu|dubai|paris|london|new york|los angeles|san francisco|napa)\b/i,
];

const SEGMENT_PATTERNS: RegExp[] = [
  /\b(?:luxury buyers?|investors?|executives?|founders?|relocation clients?|high[-\s]?net[-\s]?worth|multigenerational travelers?|honeymooners?|affluent travelers?|c-suite)\b/i,
  /\b(?:families?|first-time buyers?|enterprise teams?|retirees?)\b/i,
];

const OFFER_DETAIL_PATTERNS: RegExp[] = [
  /\$\s?\d[\d,]*/,
  /\b\d+\s?(?:bed|beds|bath|baths|nights?|days?|guests?|rooms?)\b/i,
  /\b(?:package|itinerary|private transfer|upgrade|closing timeline|commission structure|amenities included)\b/i,
];

const GLOBAL_BANNED_PHRASES: Record<VerticalPreset, Record<string, string>> = {
  luxury_realtor: {
    stunning: "well-appointed",
    nestled: "located",
    unparalleled: "distinctive",
    "game-changer": "meaningful shift",
  },
  travel_advisor: {
    breathtaking: "scenic",
    "hidden gem": "less-trafficked option",
    "off the beaten path": "outside standard itineraries",
    "game-changer": "meaningful shift",
  },
};

const GENERIC_SLOP_PATTERNS: RegExp[] = [
  /\belevate your lifestyle\b/i,
  /\bunlock your potential\b/i,
  /\btake it to the next level\b/i,
  /\bworld-class experience\b/i,
  /\bseamless solution\b/i,
  /\btransform your journey\b/i,
  /\bthis is everything\b/i,
];

const FILLER_PATTERNS: RegExp[] = [
  /\bin today's world\b/gi,
  /\bneedless to say\b/gi,
  /\bat the end of the day\b/gi,
  /\bquite frankly\b/gi,
];

const CTA_VERB_PATTERN = /\b(?:dm|message|reply|comment|book|inquire|call|email|connect|share|save)\b/i;

export const DEFAULT_VOICE_PROFILES: Record<string, UserVoiceProfile> = {
  LuxuryRealtorExecutiveCalm: {
    pov: "we",
    cadence_range: {
      minWordsPerSentence: 10,
      maxWordsPerSentence: 22,
    },
    phrase_whitelist: ["market context", "pricing strategy", "buyer readiness"],
    banned_phrase_additions: [],
  },
  TravelAdvisorExecutiveCalm: {
    pov: "we",
    cadence_range: {
      minWordsPerSentence: 10,
      maxWordsPerSentence: 22,
    },
    phrase_whitelist: ["itinerary design", "supplier coordination", "guest priorities"],
    banned_phrase_additions: [],
  },
};

type PipelineOptions = {
  voice_profile?: Partial<UserVoiceProfile>;
  user_banned_phrases?: string[];
};

export function isHardenedGenerateRequest(value: unknown): value is Intake {
  return HARDENED_REQUEST_SCHEMA.safeParse(value).success;
}

export function normalizeHardenedIntake(input: Intake): Intake {
  const normalized = HARDENED_REQUEST_SCHEMA.parse(input);
  return {
    ...normalized,
    raw_ip: normalized.raw_ip.trim(),
    q1_about: normalized.q1_about.trim(),
    q2_why: normalized.q2_why.trim(),
    q3_who: normalized.q3_who.trim(),
  };
}

export function routeIntentClass(intake: Intake): IntentClass {
  return intake.objective_chip;
}

function toSourceBundle(intake: Intake): string {
  const listingFacts = intake.listing_facts
    ? Object.entries(intake.listing_facts)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join("\n")
    : "";

  return [intake.raw_ip, intake.q1_about, intake.q2_why, intake.q3_who, listingFacts]
    .filter(Boolean)
    .join("\n")
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function sentenceWordCount(sentence: string): number {
  return sentence.trim().split(WORD_SPLIT_PATTERN).filter(Boolean).length;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function titleCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function getDefaultVoiceProfile(vertical: VerticalPreset): UserVoiceProfile {
  return vertical === "luxury_realtor"
    ? DEFAULT_VOICE_PROFILES.LuxuryRealtorExecutiveCalm
    : DEFAULT_VOICE_PROFILES.TravelAdvisorExecutiveCalm;
}

function mergeVoiceProfile(defaultProfile: UserVoiceProfile, override?: Partial<UserVoiceProfile>): UserVoiceProfile {
  if (!override) return defaultProfile;
  return {
    pov: override.pov ?? defaultProfile.pov,
    cadence_range: {
      minWordsPerSentence:
        override.cadence_range?.minWordsPerSentence ?? defaultProfile.cadence_range.minWordsPerSentence,
      maxWordsPerSentence:
        override.cadence_range?.maxWordsPerSentence ?? defaultProfile.cadence_range.maxWordsPerSentence,
    },
    phrase_whitelist: override.phrase_whitelist ?? defaultProfile.phrase_whitelist,
    banned_phrase_additions: override.banned_phrase_additions ?? defaultProfile.banned_phrase_additions,
  };
}

function extractAuthorityMatches(text: string, patterns: RegExp[]): string[] {
  const matches = new Set<string>();
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      for (const entry of found) {
        matches.add(entry.trim());
      }
    }
  }
  return Array.from(matches).filter(Boolean);
}

export function detectAuthorityMarkers(text: string): {
  hasAuthority: boolean;
  categories: AuthorityMarkerCategory[];
  markers: Record<AuthorityMarkerCategory, string[]>;
} {
  const locationMatches = extractAuthorityMatches(text, LOCATION_PATTERNS);
  const segmentMatches = extractAuthorityMatches(text, SEGMENT_PATTERNS);
  const offerMatches = extractAuthorityMatches(text, OFFER_DETAIL_PATTERNS);

  const categories: AuthorityMarkerCategory[] = [];
  if (locationMatches.length > 0) categories.push("location");
  if (segmentMatches.length > 0) categories.push("segment");
  if (offerMatches.length > 0) categories.push("offer_detail");

  return {
    hasAuthority: categories.length > 0,
    categories,
    markers: {
      location: locationMatches,
      segment: segmentMatches,
      offer_detail: offerMatches,
    },
  };
}

function summarizeRawIp(rawIp: string): string[] {
  const sentences = splitSentences(rawIp);
  if (sentences.length >= 3) {
    return sentences.slice(0, 3);
  }

  const clauses = rawIp
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (clauses.length >= 3) {
    return clauses.slice(0, 3);
  }

  const compact = rawIp.replace(/\s+/g, " ").trim();
  if (!compact) return ["Source details required."];

  return [compact.slice(0, 240), compact.slice(240, 480), compact.slice(480, 720)]
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildLinkedInSections(intake: Intake, intentClass: IntentClass): {
  hook: string;
  context: string;
  insights: string[];
  cta: string[];
} {
  const authority = detectAuthorityMarkers(toSourceBundle(intake));
  const authorityText = authority.hasAuthority
    ? Object.values(authority.markers)
        .flat()
        .slice(0, 2)
        .join(" | ")
    : intake.q3_who || "qualified prospects";

  const hook = `Leaders in ${authorityText || "premium markets"} keep performance predictable when intent stays explicit from day one.`;
  const context = [
    intake.q1_about || "The asset focus is provided in the intake.",
    intake.q2_why || "The business impact is to improve conversion quality.",
    `Audience: ${intake.q3_who || "decision-ready clients"}.`,
  ].join(" ");

  const rawPoints = summarizeRawIp(intake.raw_ip);
  const insightTail =
    intentClass === "inquiries"
      ? "Frame each proof point so the reader can reply with one specific next-step question."
      : intentClass === "authority"
      ? "Keep claims tied to observable details instead of broad positioning language."
      : "Use one concrete proof point per section so the message remains verifiable.";

  const insights = [
    rawPoints[0] || "Lead with one verifiable property or itinerary detail.",
    rawPoints[1] || "Explain how the detail changes the buyer or traveler decision.",
    `${rawPoints[2] || "Close with a direct execution takeaway."} ${insightTail}`,
  ];

  const cta =
    intentClass === "inquiries"
      ? [
          "If you want the exact shortlist criteria, reply with your timeline and target range.",
          "I will send the qualification checklist we use before presenting options.",
        ]
      : [
          "If this matches your current objective, message us with your constraints.",
          "We will return a concise recommendation in one pass.",
        ];

  return { hook, context, insights, cta };
}

function buildLinkedInDraft(intake: Intake, intentClass: IntentClass): {
  sections: Record<string, unknown>;
  draft: string;
} {
  const sections = buildLinkedInSections(intake, intentClass);

  const base = () =>
    normalizeWhitespace(
      [
        "Hook:",
        sections.hook,
        "",
        "Context:",
        sections.context,
        "",
        "Insights:",
        `- ${sections.insights[0]}`,
        `- ${sections.insights[1]}`,
        `- ${sections.insights[2]}`,
        "",
        "CTA:",
        sections.cta[0],
        sections.cta[1],
      ].join("\n")
    );

  let draft = base();

  while (draft.length < 600) {
    const enrichment = `Execution note: ${intake.raw_ip.slice(0, 220)}.`;
    const updatedInsights = [...sections.insights, enrichment];
    sections.insights = updatedInsights;
    draft = normalizeWhitespace(
      [
        "Hook:",
        sections.hook,
        "",
        "Context:",
        sections.context,
        "",
        "Insights:",
        ...updatedInsights.map((entry) => `- ${entry}`),
        "",
        "CTA:",
        sections.cta[0],
        sections.cta[1],
      ].join("\n")
    );

    if (updatedInsights.length >= 6) {
      break;
    }
  }

  if (draft.length > 1200) {
    const overBy = draft.length - 1200;
    const trimmedContext = sections.context.slice(0, Math.max(120, sections.context.length - overBy));
    sections.context = trimmedContext;
    draft = normalizeWhitespace(
      [
        "Hook:",
        sections.hook,
        "",
        "Context:",
        trimmedContext,
        "",
        "Insights:",
        ...(sections.insights as string[]).slice(0, 4).map((entry) => `- ${entry}`),
        "",
        "CTA:",
        sections.cta[0],
        sections.cta[1],
      ].join("\n")
    ).slice(0, 1200);
  }

  return {
    sections: {
      Hook: sections.hook,
      Context: sections.context,
      Insights: sections.insights,
      CTA: sections.cta,
    },
    draft,
  };
}

function buildInstagramSlides(intake: Intake, intentClass: IntentClass): {
  slides: string[];
  caption: string;
  hashtags: string[];
} {
  const authority = detectAuthorityMarkers(toSourceBundle(intake));
  const authorityMarker = authority.hasAuthority
    ? Object.values(authority.markers)
        .flat()
        .slice(0, 2)
        .join(" | ")
    : intake.q3_who || "qualified audience";

  const points = summarizeRawIp(intake.raw_ip);
  const slides = [
    `Slide 1 Hook: ${intake.q1_about || "Premium brief"} for ${authorityMarker}.`,
    `Slide 2 Context: ${intake.q2_why || "The goal is measurable quality, not generic reach."}`,
    `Slide 3 Insight: ${points[0] || "Lead with one concrete detail that can be verified."}`,
    `Slide 4 Insight: ${points[1] || "Tie every detail to a decision the audience can make today."}`,
    `Slide 5 Proof: ${points[2] || "Use specifics on segment, location, or offer detail."}`,
    `Slide 6 CTA: ${
      intentClass === "inquiries"
        ? "Reply with your travel window or target property range and we will send a precise shortlist."
        : "Save this and message us with your constraints for a focused recommendation."
    }`,
  ];

  const captionParts = [
    intake.q1_about,
    intake.q2_why,
    intake.q3_who,
    points.join(" "),
    `Authority marker: ${authorityMarker}.`,
    "The objective is execution clarity with factual precision, not broad claims.",
    intentClass === "inquiries"
      ? "If you want a tailored path, share your constraints and preferred timeline."
      : "If this aligns with your current objective, send your constraints for a concise response.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const minWords = 100;
  const maxWords = 250;
  const filler =
    "We keep each recommendation grounded in source facts, segment fit, and a practical next step for decision-ready clients.";

  let caption = captionParts;
  while (
    caption.split(WORD_SPLIT_PATTERN).filter(Boolean).length < minWords &&
    caption.split(WORD_SPLIT_PATTERN).filter(Boolean).length < maxWords
  ) {
    caption = `${caption} ${filler}`.trim();
  }

  const clippedWords = caption.split(WORD_SPLIT_PATTERN).filter(Boolean).slice(0, maxWords);
  caption = clippedWords.join(" ");

  const hashtags = [
    `#${titleCase(intake.vertical === "luxury_realtor" ? "luxury real estate" : "luxury travel")}`,
    `#${titleCase(intentClass)}`,
    "#ExecutiveCalm",
  ].slice(0, 3);

  return {
    slides,
    caption,
    hashtags,
  };
}

function buildInstagramDraft(intake: Intake, intentClass: IntentClass): {
  sections: Record<string, unknown>;
  draft: string;
} {
  const built = buildInstagramSlides(intake, intentClass);
  const draft = normalizeWhitespace(
    [
      ...built.slides,
      "",
      `Caption: ${built.caption}`,
      `Hashtags: ${built.hashtags.join(" ")}`,
    ].join("\n")
  );

  return {
    sections: {
      slides: built.slides,
      caption: built.caption,
      hashtags: built.hashtags,
    },
    draft,
  };
}

function applyPhraseBanFilter(text: string, vertical: VerticalPreset, profile: UserVoiceProfile): {
  text: string;
  replacements: string[];
} {
  const replacements: string[] = [];
  let next = text;

  const banMap = GLOBAL_BANNED_PHRASES[vertical];
  for (const [phrase, replacement] of Object.entries(banMap)) {
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi");
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement);
      replacements.push(`${phrase} -> ${replacement}`);
    }
  }

  for (const userPhrase of profile.banned_phrase_additions || []) {
    const phrase = userPhrase.trim();
    if (!phrase) continue;
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi");
    if (pattern.test(next)) {
      next = next.replace(pattern, "");
      replacements.push(`${phrase} -> removed`);
    }
  }

  return { text: normalizeWhitespace(next), replacements };
}

function applyPointOfView(text: string, pov: UserVoiceProfile["pov"]): string {
  if (pov === "i") return text;
  if (pov === "we") {
    return text.replace(/\bI\b/g, "We").replace(/\bmy\b/gi, "our");
  }
  return text
    .replace(/\bI\b/g, "The brand")
    .replace(/\bmy\b/gi, "the brand's")
    .replace(/\bwe\b/gi, "the brand");
}

function enforceCadence(text: string, cadence: UserVoiceProfile["cadence_range"]): string {
  const lines = text.split("\n");
  const adjustedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.endsWith(":") ||
      /^Slide\s+\d+/i.test(trimmed) ||
      /^[-*]\s+/.test(trimmed) ||
      /^Caption:/i.test(trimmed) ||
      /^Hashtags:/i.test(trimmed)
    ) {
      return line;
    }

    const count = sentenceWordCount(trimmed);
    if (count <= cadence.maxWordsPerSentence && count >= cadence.minWordsPerSentence) {
      return line;
    }

    if (count > cadence.maxWordsPerSentence) {
      const words = trimmed.split(WORD_SPLIT_PATTERN).filter(Boolean);
      const first = words.slice(0, cadence.maxWordsPerSentence).join(" ");
      const second = words.slice(cadence.maxWordsPerSentence).join(" ");
      return second ? `${first}. ${second}` : first;
    }

    if (count < cadence.minWordsPerSentence) {
      return `${trimmed} This keeps decision quality high.`;
    }

    return line;
  });

  return normalizeWhitespace(adjustedLines.join("\n"));
}

function detectRepeatedOpeners(text: string): string[] {
  const sentences = splitSentences(text);
  const openerCount = new Map<string, number>();

  for (const sentence of sentences) {
    const words = sentence.toLowerCase().split(WORD_SPLIT_PATTERN).filter(Boolean);
    const opener = words.slice(0, 2).join(" ");
    if (!opener) continue;
    openerCount.set(opener, (openerCount.get(opener) ?? 0) + 1);
  }

  const repeated = Array.from(openerCount.entries())
    .filter(([, count]) => count >= 3)
    .map(([opener]) => opener);

  return repeated;
}

function detectMirroredIntroOutro(text: string): boolean {
  const sentences = splitSentences(text);
  if (sentences.length < 2) return false;

  const first = sentences[0].toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const last = sentences[sentences.length - 1]
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  if (!first || !last) return false;
  return first.slice(0, 24) === last.slice(0, 24);
}

function detectSlopIssues(text: string): string[] {
  const issues: string[] = [];

  const repeatedOpeners = detectRepeatedOpeners(text);
  if (repeatedOpeners.length > 0) {
    issues.push(`Fix This: Repetitive sentence openers detected (${repeatedOpeners.join(", ")}).`);
  }

  for (const pattern of GENERIC_SLOP_PATTERNS) {
    if (pattern.test(text)) {
      issues.push("Fix This: Generic abstract phrasing detected; replace with concrete details.");
      break;
    }
  }

  if (detectMirroredIntroOutro(text)) {
    issues.push("Fix This: Intro and outro mirror each other; close with a distinct concrete CTA.");
  }

  return issues;
}

function runDeterministicSlopRewrite(text: string): string {
  let next = text;
  for (const pattern of FILLER_PATTERNS) {
    next = next.replace(pattern, "");
  }

  for (const pattern of GENERIC_SLOP_PATTERNS) {
    next = next.replace(pattern, "specific operational detail");
  }

  const lines = normalizeWhitespace(next).split("\n");
  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1]?.trim().toLowerCase() === line.trim().toLowerCase()) {
      continue;
    }
    deduped.push(line);
  }

  return normalizeWhitespace(deduped.join("\n"));
}

function validateLinkedInStructure(draft: string): string[] {
  const issues: string[] = [];
  const normalized = normalizeWhitespace(draft);

  if (!(normalized.includes("Hook:") && normalized.includes("Context:") && normalized.includes("Insights:") && normalized.includes("CTA:"))) {
    issues.push("Fix This: LinkedIn draft must include Hook, Context, Insights, and CTA sections.");
  }

  if (normalized.length < 600 || normalized.length > 1200) {
    issues.push("Fix This: LinkedIn draft length must be between 600 and 1200 characters.");
  }

  const first200 = normalized.slice(0, 200);
  if (!first200.includes("Hook:")) {
    issues.push("Fix This: LinkedIn hook must appear in the first 200 characters.");
  }

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const lastTwo = lines.slice(-2).join(" ");
  if (!CTA_VERB_PATTERN.test(lastTwo)) {
    issues.push("Fix This: LinkedIn CTA must be in the final two lines.");
  }

  return issues;
}

function validateInstagramStructure(sections: Record<string, unknown>, draft: string): string[] {
  const issues: string[] = [];
  const slides = Array.isArray(sections.slides) ? (sections.slides as string[]) : [];
  const caption = typeof sections.caption === "string" ? sections.caption : "";
  const hashtags = Array.isArray(sections.hashtags) ? (sections.hashtags as string[]) : [];

  if (slides.length < 5 || slides.length > 10) {
    issues.push("Fix This: Instagram carousel requires 5-10 slides.");
  }

  if (!slides[0] || !/hook/i.test(slides[0])) {
    issues.push("Fix This: Slide 1 must be a hook.");
  }

  const finalSlide = slides[slides.length - 1] || "";
  if (!CTA_VERB_PATTERN.test(finalSlide)) {
    issues.push("Fix This: Final carousel slide must contain a CTA.");
  }

  const captionWordCount = caption.split(WORD_SPLIT_PATTERN).filter(Boolean).length;
  if (captionWordCount < 100 || captionWordCount > 250) {
    issues.push("Fix This: Instagram caption must be 100-250 words.");
  }

  if (hashtags.length > 3) {
    issues.push("Fix This: Instagram output allows at most 3 hashtags.");
  }

  const authority = detectAuthorityMarkers(draft);
  if (!authority.hasAuthority) {
    issues.push("Fix This: Include at least one authority marker (location, segment, or offer detail).");
  }

  return issues;
}

function collectMaterialNumbers(text: string): string[] {
  const matches =
    text.match(/\$\s?\d[\d,]*(?:\.\d+)?|\b\d+(?:[.,]\d+)?%|\b\d+\s?(?:bed|beds|bath|baths|nights?|days?|guests?|rooms?)\b/gi) ??
    [];
  return Array.from(new Set(matches.map((entry) => entry.toLowerCase().replace(/\s+/g, ""))));
}

function buildTokenSet(text: string): Set<string> {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "your",
    "will",
    "into",
    "about",
    "have",
    "has",
    "are",
    "our",
    "you",
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(WORD_SPLIT_PATTERN)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !stopwords.has(token));

  return new Set(tokens);
}

function runFactSafetyValidation(intake: Intake, draft: string): string[] {
  const issues: string[] = [];
  const sourceBundle = toSourceBundle(intake);
  const sourceNumbers = new Set(collectMaterialNumbers(sourceBundle));
  const sanitizedDraft = draft.replace(/Slide\s+\d+\s*/gi, " ");
  const draftNumbers = collectMaterialNumbers(sanitizedDraft);

  const ungroundedNumbers = draftNumbers.filter((value) => !sourceNumbers.has(value));
  if (ungroundedNumbers.length > 0) {
    issues.push(
      `Fix This: Potential fabricated numeric claim(s): ${ungroundedNumbers.slice(0, 3).join(", ")}. Use only source facts.`
    );
  }

  const claimSentences = splitSentences(draft).filter((sentence) => {
    return /\b(?:ranked|award|roi|increase|decrease|sold|guarantee|top|best|fastest|exclusive)\b/i.test(sentence);
  });

  const sourceTokens = buildTokenSet(sourceBundle);
  for (const sentence of claimSentences) {
    const sentenceTokens = Array.from(buildTokenSet(sentence));
    const overlap = sentenceTokens.filter((token) => sourceTokens.has(token));
    if (overlap.length < 2) {
      issues.push("Fix This: Potential ungrounded claim detected. Provide source-backed detail or remove the claim.");
      break;
    }
  }

  return issues;
}

function buildMicroQuestion(issues: string[], intake: Intake): string | undefined {
  if (issues.length === 0) return undefined;

  if (issues.some((issue) => issue.toLowerCase().includes("authority marker"))) {
    return "What is one concrete authority marker to include (location, client segment, or offer detail)?";
  }

  if (issues.some((issue) => issue.toLowerCase().includes("numeric claim"))) {
    return "Which exact numeric detail from your source should we keep, and which should be removed?";
  }

  if (
    (intake.objective_chip === "promote" || intake.objective_chip === "showcase" || intake.objective_chip === "inquiries") &&
    !detectAuthorityMarkers(toSourceBundle(intake)).markers.offer_detail.length
  ) {
    return "What single offer detail can we cite exactly (price point, package inclusion, or timeline)?";
  }

  return "Which single detail should be corrected so the draft can be published safely?";
}

export function runSynqraPipeline(input: Intake, options?: PipelineOptions): Envelope {
  const intake = normalizeHardenedIntake(input);
  const intentClass = routeIntentClass(intake);
  const issues: string[] = [];

  const rawIsLongEnough = intake.raw_ip.length >= 50 || URL_PATTERN.test(intake.raw_ip);
  if (!rawIsLongEnough) {
    issues.push("Fix This: Provide at least 50 characters of source IP or a valid URL.");
  }

  const authority = detectAuthorityMarkers(toSourceBundle(intake));
  if (!authority.hasAuthority) {
    issues.push("Fix This: Include at least one authority marker (location, segment, or offer detail).");
  }

  let skeletonSections: Record<string, unknown>;
  let drafted: string;

  if (intake.platform === "linkedin") {
    const built = buildLinkedInDraft(intake, intentClass);
    skeletonSections = built.sections;
    drafted = built.draft;
  } else {
    const built = buildInstagramDraft(intake, intentClass);
    skeletonSections = built.sections;
    drafted = built.draft;
  }

  const defaultProfile = getDefaultVoiceProfile(intake.vertical);
  const mergedProfile = mergeVoiceProfile(defaultProfile, options?.voice_profile);
  const profileWithUserBans: UserVoiceProfile = {
    ...mergedProfile,
    banned_phrase_additions: [
      ...(mergedProfile.banned_phrase_additions || []),
      ...(options?.user_banned_phrases || []),
    ],
  };

  const phraseFiltered = applyPhraseBanFilter(drafted, intake.vertical, profileWithUserBans);
  drafted = phraseFiltered.text;
  drafted = applyPointOfView(drafted, profileWithUserBans.pov);
  drafted = enforceCadence(drafted, profileWithUserBans.cadence_range);

  let slopIssues = detectSlopIssues(drafted);
  if (slopIssues.length > 0) {
    drafted = runDeterministicSlopRewrite(drafted);
    slopIssues = detectSlopIssues(drafted);
  }

  if (slopIssues.length > 0) {
    issues.push(...slopIssues.slice(0, 2));
  }

  const structureIssues =
    intake.platform === "linkedin"
      ? validateLinkedInStructure(drafted)
      : validateInstagramStructure(skeletonSections, drafted);

  if (structureIssues.length > 0) {
    issues.push(...structureIssues);
  }

  const factIssues = runFactSafetyValidation(intake, drafted);
  if (factIssues.length > 0) {
    issues.push(...factIssues);
  }

  const dedupedIssues = Array.from(new Set(issues));
  const pass = dedupedIssues.length === 0;
  const nextAction: Envelope["next_action"] = pass ? "deliver" : "ask_micro_question";
  const microQuestion = nextAction === "ask_micro_question" ? buildMicroQuestion(dedupedIssues, intake) : undefined;

  return {
    platform: intake.platform,
    intent_class: intentClass,
    skeleton_sections: skeletonSections,
    draft_text: normalizeWhitespace(drafted),
    validation_report: {
      pass,
      issues: dedupedIssues,
    },
    next_action: nextAction,
    ...(microQuestion ? { micro_question: microQuestion } : {}),
  };
}
