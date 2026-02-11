import assert from "assert";
import { applyComplianceRules } from "@/lib/platforms/compliance";

async function run() {
  const sample = [
    "This family-friendly home is perfect for singles.",
    "The bachelor pad has a master bedroom and is great for kids.",
    "Ideal for empty nesters and young professionals in a safe neighborhood.",
  ].join(" ");

  const result = applyComplianceRules(sample, {
    platform: "linkedin",
    vertical: "realtor",
  });
  const normalized = result.content.toLowerCase();

  const blockedPhrases = [
    "family-friendly",
    "perfect for singles",
    "bachelor pad",
    "master bedroom",
    "great for kids",
    "empty nesters",
    "young professionals",
    "safe neighborhood",
  ];

  for (const phrase of blockedPhrases) {
    assert.ok(!normalized.includes(phrase), `Expected compliance filter to remove phrase: ${phrase}`);
  }

  assert.ok(
    result.accessibilityReminders.some((item) => item.toLowerCase().includes("links in post body can reduce linkedin distribution")),
    "LinkedIn compliance reminders should include link placement guidance"
  );

  process.stdout.write(JSON.stringify({ ok: true }) + "\n");
}

run().catch((error) => {
  process.stderr.write(`compliance regression failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
