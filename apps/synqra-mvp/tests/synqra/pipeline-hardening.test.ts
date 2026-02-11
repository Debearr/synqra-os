import assert from "assert";
import { readFile } from "fs/promises";
import path from "path";
import { runSynqraPipeline } from "@/utils/synqra/pipeline";
import { saveVoiceReference, scoreDriftAudit } from "@/utils/synqra/learning";

async function run() {
  const linkedInEnvelope = runSynqraPipeline({
    platform: "linkedin",
    raw_ip:
      "We are marketing a $2,800,000 penthouse in Miami, FL for relocation executives seeking a waterfront primary residence with immediate occupancy and concierge services.",
    q1_about: "Penthouse positioning for executive relocation buyers",
    q2_why: "Need qualified inquiries with decision-ready timelines",
    q3_who: "Relocation executives and investors",
    objective_chip: "inquiries",
    vertical: "luxury_realtor",
    user_id: "test-user-1",
  });

  assert.strictEqual(linkedInEnvelope.platform, "linkedin");
  assert.strictEqual(linkedInEnvelope.intent_class, "inquiries");
  assert.strictEqual(linkedInEnvelope.next_action, "deliver");
  assert.ok(linkedInEnvelope.validation_report.pass, "LinkedIn envelope should pass deterministic validation");
  assert.ok(linkedInEnvelope.draft_text.includes("Hook:"));
  assert.ok(linkedInEnvelope.draft_text.includes("CTA:"));

  const authorityMissingEnvelope = runSynqraPipeline({
    platform: "linkedin",
    raw_ip:
      "This content explains the operating process, sequencing, and communication approach for a polished launch with clear internal accountability and team execution.",
    q1_about: "Operating process clarity",
    q2_why: "Improve consistency",
    q3_who: "Leadership team",
    objective_chip: "authority",
    vertical: "travel_advisor",
    user_id: "test-user-2",
  });

  assert.strictEqual(authorityMissingEnvelope.next_action, "ask_micro_question");
  assert.ok(
    authorityMissingEnvelope.validation_report.issues.some((issue) => issue.toLowerCase().includes("authority marker")),
    "Missing authority marker should be flagged"
  );
  assert.ok(authorityMissingEnvelope.micro_question, "Micro question should be returned when asking for fixes");

  const saveResult = await saveVoiceReference({
    user_id: "test-user-1",
    vertical: "luxury_realtor",
    platform: "linkedin",
    generated_draft: linkedInEnvelope.draft_text,
    approved_content: `${linkedInEnvelope.draft_text}\n\nReply with your target window if you want a focused shortlist?`,
  });

  assert.ok(saveResult.stored);
  assert.ok(saveResult.references_saved >= 1);

  const storePath = process.env.SYNQRA_VOICE_STORE_PATH || path.join(process.cwd(), "audit", "voice-learning-store.json");
  const persisted = await readFile(storePath, "utf8");
  assert.ok(!persisted.includes("approved_content"), "Store must persist patterns, not raw approved content field names");

  const driftScore = scoreDriftAudit([
    {
      platform: "linkedin",
      draft_text: linkedInEnvelope.draft_text,
    },
    {
      platform: "instagram_carousel",
      draft_text:
        "Slide 1 Hook: Premium itinerary design for affluent travelers.\nSlide 2 Context: Supplier coordination.\nSlide 3 Insight: Private transfer inclusion.\nSlide 4 Insight: Multi-stop alignment.\nSlide 5 Proof: 7 nights with verified pricing.\nSlide 6 CTA: Message us with your travel window.\nCaption: This is a grounded draft with clear facts and measurable details for itinerary decisions. This is a grounded draft with clear facts and measurable details for itinerary decisions. This is a grounded draft with clear facts and measurable details for itinerary decisions. This is a grounded draft with clear facts and measurable details for itinerary decisions. This is a grounded draft with clear facts and measurable details for itinerary decisions.\nHashtags: #LuxuryTravel #Authority #ExecutiveCalm",
    },
  ]);

  assert.strictEqual(driftScore.sampled, 2);
  assert.ok(typeof driftScore.slop_rate === "number");

  process.stdout.write(JSON.stringify({ ok: true }) + "\n");
}

run().catch((error) => {
  process.stderr.write(`synqra pipeline hardening regression failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
