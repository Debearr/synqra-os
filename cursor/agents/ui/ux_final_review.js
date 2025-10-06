// UX Stress-Audit Runner (Copilot seat)
export async function run($json, Supabase, runCouncil) {
  const uiAssets = ["/ui/dashboard.html", "/ui/onboarding.html"];
  const feedback = await runCouncil("copilot", {
    task: "ui_review",
    target: "Synqra_NØID_UI",
    criteria: ["contrast", "spacing", "mobile_fit", "tap_target", "font_legibility"]
  });
  const { error } = await Supabase.from("ui_audit_results").insert([{ feedback, assets: uiAssets, timestamp: Date.now() }]);
  if (error) return [{ json: { status: "error", message: error.message } }];
  return [{ json: { status: "audit_complete", feedback } }];
}
