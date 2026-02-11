export const BROKERAGE_REQUIRED_ERROR = "Brokerage name required (RECO compliance).";
export const BANNED_WORD_ERROR = "This word violates RECO advertising standards.";
export const NAME_TRUNCATION_WARNING = "Name may truncate on small screens.";
export const INVALID_GTA_ADDRESS_ERROR = "Address not recognized. Please enter a valid GTA address.";
export const GENERATION_FAILED_ERROR = "Generation failed. Please try again or contact support.";
export const PHOTO_TOO_SMALL_ERROR = "Photo resolution too low. Minimum 1200×1200 required.";

export const BANNED_WORDS = ["best", "guaranteed", "cheapest", "#1 agent", "top agent"] as const;
export const SIGNATURE_STYLE_OPTIONS = ["gold_underline", "thin_gold_border", "monogram_circle"] as const;
export type SignatureStyle = (typeof SIGNATURE_STYLE_OPTIONS)[number];

const AGENT_NAME_MAX_LENGTH = 40;
const AGENT_NAME_WARNING_THRESHOLD = 35;
const DISALLOWED_SAMPLE_TOKENS = ["4", "14", "24", "44", "444"] as const;

export const REALTOR_SAMPLE_DEFAULTS = Object.freeze({
  address: "888 Forest Hill Road",
  brokerageName: "Synqra Realty",
  agentName: "Synqra Agent",
});

function normalize(value: string): string {
  return value.normalize("NFC").trim();
}

function sampleDataContainsDisallowedToken(value: string): boolean {
  return DISALLOWED_SAMPLE_TOKENS.some((token) => value.includes(token));
}

function assertSampleDefaults(): void {
  const values = Object.values(REALTOR_SAMPLE_DEFAULTS);
  for (const value of values) {
    if (sampleDataContainsDisallowedToken(value)) {
      throw new Error("Sample data includes disallowed numeric token.");
    }
  }
}

assertSampleDefaults();

export function normalizeUtf8(value: string): string {
  return normalize(value);
}

export function containsBannedWord(value: string): boolean {
  const haystack = normalize(value).toLowerCase();
  return BANNED_WORDS.some((phrase) => haystack.includes(phrase));
}

export function assertNoBannedWords(values: string[]): void {
  if (values.some((value) => containsBannedWord(value))) {
    throw new Error(BANNED_WORD_ERROR);
  }
}

export function sanitizeAgentName(value: string | null | undefined): {
  value: string | null;
  warning: string | null;
} {
  if (!value) {
    return { value: null, warning: null };
  }

  const normalized = normalize(value);
  if (!normalized) {
    return { value: null, warning: null };
  }

  const warning = normalized.length >= AGENT_NAME_WARNING_THRESHOLD ? NAME_TRUNCATION_WARNING : null;
  if (normalized.length <= AGENT_NAME_MAX_LENGTH) {
    return { value: normalized, warning };
  }

  return {
    value: `${normalized.slice(0, AGENT_NAME_MAX_LENGTH - 3)}...`,
    warning,
  };
}

export function parseIncludeEho(value: FormDataEntryValue | null): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
}

export function parseSignatureStyle(value: FormDataEntryValue | null | undefined): SignatureStyle | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (SIGNATURE_STYLE_OPTIONS.includes(normalized as SignatureStyle)) {
    return normalized as SignatureStyle;
  }
  return null;
}

const GTA_CITY_TOKENS = [
  "toronto",
  "north york",
  "scarborough",
  "etobicoke",
  "york",
  "east york",
  "mississauga",
  "brampton",
  "markham",
  "vaughan",
  "richmond hill",
  "oakville",
  "milton",
  "ajax",
  "pickering",
  "whitby",
  "oshawa",
  "newmarket",
  "aurora",
  "caledon",
] as const;

export function isRecognizedGtaAddress(value: string): boolean {
  const address = normalize(value).toLowerCase();
  if (!address) return false;

  if (GTA_CITY_TOKENS.some((token) => address.includes(token))) {
    return true;
  }

  const postalMatch = address.match(/\b([a-z]\d[a-z])[ -]?(\d[a-z]\d)\b/i);
  if (!postalMatch) {
    return false;
  }

  const fsa = postalMatch[1].toUpperCase();
  if (fsa.startsWith("M")) {
    return true;
  }
  if (/^L[0-9]/.test(fsa)) {
    return true;
  }

  return false;
}
