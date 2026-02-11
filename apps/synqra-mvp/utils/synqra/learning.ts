import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  DEFAULT_VOICE_PROFILES,
  detectAuthorityMarkers,
  type Platform,
  type UserVoiceProfile,
  type VerticalPreset,
} from "@/utils/synqra/pipeline";

type HookStyleType = "contrarian" | "stat" | "story" | "framework" | "direct";
type CtaStyleType = "question" | "soft-invite" | "dm-keyword" | "none";

export type VoicePatternSnapshot = {
  hook_style_type: HookStyleType;
  cta_style_type: CtaStyleType;
  avg_sentence_length: number;
  authority_marker_style: string[];
  phrase_whitelist_candidates: string[];
};

export type VoiceLearningSignals = {
  references_saved: number;
  hook_style_counts: Record<string, number>;
  cta_style_counts: Record<string, number>;
  avg_sentence_lengths: number[];
  authority_marker_style_counts: Record<string, number>;
  phrase_whitelist_candidate_counts: Record<string, number>;
  negative_phrase_counts: Record<string, number>;
  banned_phrase_additions: string[];
  last_updated_iso: string;
};

export type UserLearningRecord = {
  user_id: string;
  vertical: VerticalPreset;
  voice_profile: UserVoiceProfile;
  signals: VoiceLearningSignals;
};

export type UserVoiceProfileInput = {
  pov?: UserVoiceProfile["pov"];
  cadence_range?: {
    minWordsPerSentence?: number;
    maxWordsPerSentence?: number;
  };
  phrase_whitelist?: string[];
  banned_phrase_additions?: string[];
};

type LearningStoreFile = {
  version: 1;
  users: Record<string, UserLearningRecord>;
};

const STORE_PATH = process.env.SYNQRA_VOICE_STORE_PATH || path.join(process.cwd(), "audit", "voice-learning-store.json");
const DM_KEYWORD_PATTERN = /\b(dm|message|comment|reply)\b/i;
const SOFT_INVITE_PATTERN = /\b(we can|happy to|let us|feel free|reach out|connect)\b/i;
const CLICHE_PATTERNS = [
  /\bstunning\b/i,
  /\bnestled\b/i,
  /\bunparalleled\b/i,
  /\bgame[-\s]?changer\b/i,
  /\bbreathtaking\b/i,
  /\bhidden gem\b/i,
  /\boff the beaten path\b/i,
  /\belevate your lifestyle\b/i,
  /\bunlock your potential\b/i,
];
const GENERIC_PATTERNS = [/\bnext level\b/i, /\bworld-class\b/i, /\bseamless\b/i, /\btransform\b/i, /\bamazing\b/i];

function makeUserKey(userId: string, vertical: VerticalPreset): string {
  return `${vertical}:${userId}`;
}

function getVerticalDefaultProfile(vertical: VerticalPreset): UserVoiceProfile {
  return vertical === "luxury_realtor"
    ? DEFAULT_VOICE_PROFILES.LuxuryRealtorExecutiveCalm
    : DEFAULT_VOICE_PROFILES.TravelAdvisorExecutiveCalm;
}

function createEmptySignals(): VoiceLearningSignals {
  return {
    references_saved: 0,
    hook_style_counts: {},
    cta_style_counts: {},
    avg_sentence_lengths: [],
    authority_marker_style_counts: {},
    phrase_whitelist_candidate_counts: {},
    negative_phrase_counts: {},
    banned_phrase_additions: [],
    last_updated_iso: new Date().toISOString(),
  };
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizePhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function incrementCounter(map: Record<string, number>, key: string, amount = 1): void {
  if (!key) return;
  map[key] = (map[key] ?? 0) + amount;
}

async function ensureStoreDir(): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function loadStore(): Promise<LearningStoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LearningStoreFile;
    if (parsed && parsed.version === 1 && parsed.users) {
      return parsed;
    }
  } catch {
    // fall through to empty store
  }

  return {
    version: 1,
    users: {},
  };
}

async function saveStore(store: LearningStoreFile): Promise<void> {
  await ensureStoreDir();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function inferHookStyle(text: string): HookStyleType {
  const firstLine = text.split(/\n+/).map((line) => line.trim()).find(Boolean) || "";
  if (/\b(unlike|instead of|not|stop)\b/i.test(firstLine)) return "contrarian";
  if (/\b\d+(?:[.,]\d+)?%?\b/.test(firstLine)) return "stat";
  if (/\b(when|last|client|story)\b/i.test(firstLine)) return "story";
  if (/\b(framework|step|playbook|process)\b/i.test(firstLine)) return "framework";
  return "direct";
}

function inferCtaStyle(text: string): CtaStyleType {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const tail = lines.slice(-2).join(" ");
  if (!tail) return "none";
  if (tail.endsWith("?")) return "question";
  if (DM_KEYWORD_PATTERN.test(tail)) return "dm-keyword";
  if (SOFT_INVITE_PATTERN.test(tail)) return "soft-invite";
  return "none";
}

function avgSentenceLength(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  const totalWords = sentences
    .map((sentence) => sentence.split(/\s+/).filter(Boolean).length)
    .reduce((sum, length) => sum + length, 0);
  return totalWords / sentences.length;
}

function extractPhraseWhitelistCandidates(text: string): string[] {
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
    "have",
    "into",
    "about",
    "when",
    "where",
    "which",
    "while",
  ]);

  const freq = new Map<string, number>();
  const tokens = normalizePhrase(text)
    .split(/\s+/)
    .filter((token) => token.length >= 5 && !stopwords.has(token));

  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token]) => token);
}

function extractRemovedPhrases(originalDraft: string, approvedContent: string): string[] {
  const normalizedOriginal = normalizePhrase(originalDraft);
  const normalizedApproved = normalizePhrase(approvedContent);

  const candidates = normalizedOriginal
    .split(/[.!?]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.split(/\s+/).length >= 3)
    .map((segment) => segment.split(/\s+/).slice(0, 4).join(" "))
    .filter((segment) => segment.length >= 8);

  const removed = candidates.filter((phrase) => !normalizedApproved.includes(phrase));
  return Array.from(new Set(removed)).slice(0, 10);
}

export function extractVoicePatterns(input: {
  platform: Platform;
  approved_content: string;
}): VoicePatternSnapshot {
  const authority = detectAuthorityMarkers(input.approved_content);
  return {
    hook_style_type: inferHookStyle(input.approved_content),
    cta_style_type: inferCtaStyle(input.approved_content),
    avg_sentence_length: avgSentenceLength(input.approved_content),
    authority_marker_style: authority.categories,
    phrase_whitelist_candidates: extractPhraseWhitelistCandidates(input.approved_content),
  };
}

function updateNegativePatternAccumulator(params: {
  signals: VoiceLearningSignals;
  generated_draft?: string;
  approved_content: string;
}): VoiceLearningSignals {
  const nextSignals = { ...params.signals };
  if (!params.generated_draft) {
    return nextSignals;
  }

  const removed = extractRemovedPhrases(params.generated_draft, params.approved_content);
  for (const phrase of removed) {
    incrementCounter(nextSignals.negative_phrase_counts, phrase, 1);
    if (nextSignals.negative_phrase_counts[phrase] >= 3 && !nextSignals.banned_phrase_additions.includes(phrase)) {
      nextSignals.banned_phrase_additions.push(phrase);
    }
  }

  return nextSignals;
}

export async function saveVoiceReference(input: {
  user_id: string;
  vertical: VerticalPreset;
  platform: Platform;
  approved_content: string;
  generated_draft?: string;
  voice_profile?: UserVoiceProfileInput;
}): Promise<{
  stored: boolean;
  user_id: string;
  vertical: VerticalPreset;
  references_saved: number;
  banned_phrase_additions: string[];
}> {
  const store = await loadStore();
  const key = makeUserKey(input.user_id, input.vertical);
  const existing = store.users[key];
  const defaultProfile = getVerticalDefaultProfile(input.vertical);

  const currentProfile: UserVoiceProfile = existing
    ? {
        ...existing.voice_profile,
        cadence_range: {
          minWordsPerSentence: existing.voice_profile.cadence_range.minWordsPerSentence,
          maxWordsPerSentence: existing.voice_profile.cadence_range.maxWordsPerSentence,
        },
      }
    : defaultProfile;

  const mergedProfile: UserVoiceProfile = {
    pov: input.voice_profile?.pov ?? currentProfile.pov,
    cadence_range: {
      minWordsPerSentence:
        input.voice_profile?.cadence_range?.minWordsPerSentence ?? currentProfile.cadence_range.minWordsPerSentence,
      maxWordsPerSentence:
        input.voice_profile?.cadence_range?.maxWordsPerSentence ?? currentProfile.cadence_range.maxWordsPerSentence,
    },
    phrase_whitelist: input.voice_profile?.phrase_whitelist ?? currentProfile.phrase_whitelist ?? [],
    banned_phrase_additions:
      input.voice_profile?.banned_phrase_additions ?? currentProfile.banned_phrase_additions ?? [],
  };

  const patterns = extractVoicePatterns({
    platform: input.platform,
    approved_content: input.approved_content,
  });

  const signals = existing?.signals ?? createEmptySignals();
  incrementCounter(signals.hook_style_counts, patterns.hook_style_type, 1);
  incrementCounter(signals.cta_style_counts, patterns.cta_style_type, 1);
  for (const marker of patterns.authority_marker_style) {
    incrementCounter(signals.authority_marker_style_counts, marker, 1);
  }
  for (const candidate of patterns.phrase_whitelist_candidates) {
    incrementCounter(signals.phrase_whitelist_candidate_counts, candidate, 1);
  }

  signals.avg_sentence_lengths.push(patterns.avg_sentence_length);
  signals.references_saved += 1;
  signals.last_updated_iso = new Date().toISOString();

  const updatedSignals = updateNegativePatternAccumulator({
    signals,
    generated_draft: input.generated_draft,
    approved_content: input.approved_content,
  });

  mergedProfile.banned_phrase_additions = Array.from(
    new Set([...(mergedProfile.banned_phrase_additions || []), ...updatedSignals.banned_phrase_additions])
  );

  store.users[key] = {
    user_id: input.user_id,
    vertical: input.vertical,
    voice_profile: mergedProfile,
    signals: updatedSignals,
  };

  await saveStore(store);

  return {
    stored: true,
    user_id: input.user_id,
    vertical: input.vertical,
    references_saved: updatedSignals.references_saved,
    banned_phrase_additions: updatedSignals.banned_phrase_additions,
  };
}

export async function getVoiceProfileForUser(input: {
  user_id?: string;
  vertical: VerticalPreset;
}): Promise<{
  voice_profile: UserVoiceProfile;
  user_banned_phrases: string[];
}> {
  const fallback = getVerticalDefaultProfile(input.vertical);
  if (!input.user_id) {
    return {
      voice_profile: fallback,
      user_banned_phrases: fallback.banned_phrase_additions || [],
    };
  }

  const store = await loadStore();
  const key = makeUserKey(input.user_id, input.vertical);
  const entry = store.users[key];

  if (!entry) {
    return {
      voice_profile: fallback,
      user_banned_phrases: fallback.banned_phrase_additions || [],
    };
  }

  return {
    voice_profile: entry.voice_profile,
    user_banned_phrases: entry.signals.banned_phrase_additions,
  };
}

export function updateBannedPhrasesFromSignals(signals: VoiceLearningSignals): string[] {
  const additions = Object.entries(signals.negative_phrase_counts)
    .filter(([, count]) => count >= 3)
    .map(([phrase]) => phrase);

  return Array.from(new Set([...(signals.banned_phrase_additions || []), ...additions]));
}

function structurePass(platform: Platform, text: string): boolean {
  if (platform === "linkedin") {
    const hasSections = text.includes("Hook:") && text.includes("Context:") && text.includes("Insights:") && text.includes("CTA:");
    return hasSections && text.length >= 600 && text.length <= 1200;
  }

  const slideMatches = text.match(/Slide\s+\d+/gi) ?? [];
  const captionWords =
    (text.match(/Caption:\s*([\s\S]*)/i)?.[1] || "")
      .split(/\s+/)
      .filter(Boolean).length;
  return slideMatches.length >= 5 && slideMatches.length <= 10 && captionWords >= 100 && captionWords <= 250;
}

export function scoreDriftAudit(samples: Array<{ platform: Platform; draft_text: string }>): {
  sampled: number;
  cliche_density: number;
  genericness: number;
  structure_compliance_rate: number;
  slop_rate: number;
  recommendations: string[];
} {
  if (samples.length === 0) {
    return {
      sampled: 0,
      cliche_density: 0,
      genericness: 0,
      structure_compliance_rate: 1,
      slop_rate: 0,
      recommendations: ["No samples provided."],
    };
  }

  let clicheHits = 0;
  let genericHits = 0;
  let totalWords = 0;
  let structurePasses = 0;
  let slopFails = 0;

  for (const sample of samples) {
    const words = sample.draft_text.split(/\s+/).filter(Boolean);
    totalWords += words.length;

    for (const pattern of CLICHE_PATTERNS) {
      if (pattern.test(sample.draft_text)) clicheHits += 1;
    }

    for (const pattern of GENERIC_PATTERNS) {
      if (pattern.test(sample.draft_text)) genericHits += 1;
    }

    const passesStructure = structurePass(sample.platform, sample.draft_text);
    if (passesStructure) {
      structurePasses += 1;
    }

    const sampleClicheHits = CLICHE_PATTERNS.filter((pattern) => pattern.test(sample.draft_text)).length;
    const sampleGenericHits = GENERIC_PATTERNS.filter((pattern) => pattern.test(sample.draft_text)).length;
    const sampleSlop = sampleClicheHits + sampleGenericHits;
    if (sampleSlop > 0 || !passesStructure) {
      slopFails += 1;
    }
  }

  const clicheDensity = totalWords > 0 ? clicheHits / totalWords : 0;
  const genericness = totalWords > 0 ? genericHits / totalWords : 0;
  const structureComplianceRate = structurePasses / samples.length;
  const slopRate = slopFails / samples.length;

  const recommendations: string[] = [];
  if (slopRate > 0.15) {
    recommendations.push("Expand banned phrase list and tighten authority marker requirement.");
    recommendations.push("Narrow allowed length bounds for higher structure consistency.");
  }
  if (slopRate > 0.1 && slopRate <= 0.15) {
    recommendations.push("Increase deterministic rewrite strictness for generic phrasing.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Current drift score is stable.");
  }

  return {
    sampled: samples.length,
    cliche_density: Number(clicheDensity.toFixed(4)),
    genericness: Number(genericness.toFixed(4)),
    structure_compliance_rate: Number(structureComplianceRate.toFixed(4)),
    slop_rate: Number(slopRate.toFixed(4)),
    recommendations,
  };
}
