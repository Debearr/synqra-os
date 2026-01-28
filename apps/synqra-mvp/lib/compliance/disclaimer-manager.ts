// Regulatory safety: re-ack every 90 days to prevent stale consent.
const DISCLAIMER_REACK_DAYS = 90;

// Compliance language guardrail to avoid advice/solicitation framing.
const BANNED_TERMS = [
  "win rate",
  "signal",
  "recommendation",
  "trade idea",
  "entry/exit",
  "should buy",
  "recommended",
];

export type DisclaimerContext = "scenario" | "assessment" | "overview";

export interface DisclaimerContent {
  short: string;
  inline: string;
  methodology: string;
  acknowledgmentTitle: string;
}

export function getDisclaimerContent(context: DisclaimerContext): DisclaimerContent {
  const baseInline =
    "AuraFX provides probabilistic scenario analysis for educational use only. It is not financial advice and does not provide execution guidance.";

  const scenarioInline =
    "Scenarios describe probability distributions and uncertainty bands based on historical calibration ranges. They are descriptive, not prescriptive.";

  const assessmentInline =
    "Assessments summarize probabilistic distributions and calibration accuracy ranges without recommending actions.";

  // Keep methodology descriptive and non-prescriptive for regulatory safety.
  const methodology =
    "Methodology: AuraFX models market scenarios using probabilistic calibration against historical outcomes. Outputs include uncertainty bands and distribution ranges to communicate uncertainty. This system is read-only, does not execute orders, and does not provide recommendations or execution instructions.";

  const inline =
    context === "scenario"
      ? `${baseInline} ${scenarioInline}`
      : context === "assessment"
      ? `${baseInline} ${assessmentInline}`
      : baseInline;

  const content: DisclaimerContent = {
    short: baseInline,
    inline,
    methodology,
    acknowledgmentTitle: "Educational use acknowledgment",
  };

  // Hard-fail on banned terms to prevent policy regressions.
  assertNoBannedTerms(content.short);
  assertNoBannedTerms(content.inline);
  assertNoBannedTerms(content.methodology);

  return content;
}

export function requiresReacknowledgment(
  lastAcknowledgedAt: Date | null,
  now: Date = new Date()
): boolean {
  if (!lastAcknowledgedAt) {
    return true;
  }

  const msSince = now.getTime() - lastAcknowledgedAt.getTime();
  const daysSince = msSince / (1000 * 60 * 60 * 24);
  return daysSince >= DISCLAIMER_REACK_DAYS;
}

export function assertNoBannedTerms(text: string): void {
  const lowered = text.toLowerCase();
  const match = BANNED_TERMS.find((term) => lowered.includes(term));
  if (match) {
    throw new Error(`Compliance text contains banned term: "${match}"`);
  }
}

export { DISCLAIMER_REACK_DAYS };
