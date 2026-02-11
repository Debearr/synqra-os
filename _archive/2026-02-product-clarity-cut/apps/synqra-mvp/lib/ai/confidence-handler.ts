export interface ConfidenceCheck {
  isConfident: boolean;
  score: number;
  reason: string;
  suggestedAction: "proceed" | "clarify" | "fallback";
}

function isLikelyJSON(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object";
  } catch {
    return false;
  }
}

export function assessConfidence(response: string, taskType: string): ConfidenceCheck {
  const lower = response.toLowerCase();
  const hedgingTerms = ["might", "possibly", "unclear", "unsure", "not certain"];

  let score = 1.0;

  if (hedgingTerms.some((term) => lower.includes(term))) score -= 0.3;

  if (response.length < 50 || response.length > 5000) score -= 0.2;

  if (response.includes("...") || !response.trim().endsWith(".")) score -= 0.25;

  if (taskType === "classification" && !isLikelyJSON(response)) score -= 0.4;

  const threshold = 0.7;
  const isConfident = score >= threshold;
  const suggestedAction: ConfidenceCheck["suggestedAction"] =
    score >= threshold ? "proceed" : score >= 0.5 ? "clarify" : "fallback";

  return {
    isConfident,
    score,
    reason: `Confidence ${(score * 100).toFixed(0)}%`,
    suggestedAction,
  };
}
