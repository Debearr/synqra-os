// Council Insight Digest: auto-summary + technical metrics (idempotent/upsert)
const feedback = Array.isArray($json.feedbacks) ? $json.feedbacks : [];
const total = feedback.length;
const ok = feedback.filter(f => f?.result?.status === "OK").length;

const riskOrder = { low: 1, medium: 2, high: 3 };
const risks = feedback.filter(f => (riskOrder[f?.result?.risk_level] || 0) >= riskOrder.high);

const percent = total > 0 ? Number(((ok / total) * 100).toFixed(1)) : 0;

const technical_metrics = feedback.map(f => ({
  model: f?.model || "unknown",
  latency_ms: Number(f?.result?.latency || 0),
  token_usage: Number(f?.result?.tokens || 0),
  status: f?.result?.status || "unknown"
}));

const recommendations = Array.from(
  new Set(
    feedback.flatMap(f => Array.isArray(f?.result?.recommendations) ? f.result.recommendations : [])
  )
);

const summary = {
  executive_summary: `${percent}% overall health. ${risks.length ? `High-risk: ${risks.length} — auto-rollback triggered.` : "No high-risk issues detected."}`,
  technical_metrics,
  recommendations,
  counts: { ok, total },
  timestamp: new Date().toISOString()
};

const digest_id = $json.run_id || `digest_${Date.now()}`;

const { error } = await Supabase
  .from("council_digests")
  .upsert([{ digest_id, digest: summary, created_at: new Date().toISOString() }], { onConflict: "digest_id" });

if (error) {
  return [{ json: { status: "error", message: error.message } }];
}

return [{ json: { status: "digest_created", digest_id, summary } }];
