import assert from "assert";
import { applyComplianceRules } from "@/lib/platforms/compliance";
import { validateInstagramCarousel } from "@/lib/platforms/instagram";
import { validateLinkedInContent } from "@/lib/platforms/linkedin";

function buildLongInsight(): string {
  return "Execution clarity compounds when priorities, owners, and evidence stay aligned across every planning cycle. ".repeat(11);
}

async function run() {
  const hypeLinkedInDraft = [
    "Build the operating cadence before scaling the team.",
    buildLongInsight(),
    "This revolutionary move will change everything for everyone.",
    "#StrategicFocus",
    "What metric will you tighten first?",
  ].join("\n\n");
  const hypeValidation = validateLinkedInContent(hypeLinkedInDraft);
  assert.ok(
    hypeValidation.violations.some((violation) => violation.code === "hype_language"),
    "LinkedIn validation must reject hype language"
  );

  const noCtaLinkedInDraft = [
    "Clarity is the fastest way to reduce execution waste.",
    buildLongInsight(),
    "#StrategicFocus",
  ].join("\n\n");
  const ctaValidation = validateLinkedInContent(noCtaLinkedInDraft);
  assert.ok(
    ctaValidation.violations.some((violation) => violation.code === "missing_question_cta"),
    "LinkedIn validation must reject drafts without a final question CTA"
  );

  const invalidCarousel = validateInstagramCarousel({
    slides: ["Hook", "Feature", "Benefit", "CTA"],
    caption: "This caption stays short.",
    hashtags: ["#One", "#Two"],
  });
  assert.ok(
    invalidCarousel.violations.some((violation) => violation.code === "slide_count_out_of_range"),
    "Instagram validation must enforce 5-10 slide count"
  );

  const realtorCompliance = applyComplianceRules(
    "Master bedroom in a family-friendly, safe neighborhood.",
    {
      platform: "linkedin",
      vertical: "realtor",
    }
  );
  assert.ok(
    realtorCompliance.content.toLowerCase().includes("primary bedroom"),
    "Realtor compliance should replace master bedroom language"
  );
  assert.ok(
    !realtorCompliance.content.toLowerCase().includes("safe neighborhood"),
    "Realtor compliance should replace safe neighborhood language"
  );

  const travelCompliance = applyComplianceRules(
    "Sample itinerary aligned to premium traveler preferences.",
    {
      platform: "instagram",
      vertical: "travel_advisor",
    }
  );
  assert.ok(
    travelCompliance.content.toLowerCase().includes("travel advisory disclaimer:"),
    "Travel advisor compliance should append disclaimer"
  );

  process.stdout.write(JSON.stringify({ ok: true }) + "\n");
}

run().catch((error) => {
  process.stderr.write(
    `platform intelligence regression failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
