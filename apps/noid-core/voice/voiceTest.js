import { speak } from "./voiceController.js";

async function main() {
  const phrases = [
    "Hey NØID, check earnings!",
    "Activate Stealth Mode",
    "Start SmartShift Planner",
    "Sync logs with cloud"
  ];
  for (const text of phrases) {
    const file = await speak(text);
    console.log(`✅ Voice synthesized: ${file}`);
  }
}

main().catch((err) => {
  console.error("❌ Voice test failed:", err?.message || err);
  process.exit(1);
});
