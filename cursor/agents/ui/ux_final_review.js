// UX Stress-Audit Runner (Copilot seat)
const uiAssets = ["/ui/dashboard.html", "/ui/onboarding.html"];
const feedback = await runCouncil("copilot", {
  task: "ui_review",
  target: "Synqra_NØID_UI",
  criteria: ["contrast", "spacing", "mobile_fit", "tap_target", "font_legibility"]
});
await Supabase.from("ui_audit_results").insert([{ feedback, timestamp: Date.now() }]);
return [{ json: { status: "audit_complete", feedback } }];
