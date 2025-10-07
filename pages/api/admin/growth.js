import { getSupabaseAdmin } from "../../../lib/supabaseClient.js";

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    const nowIso = new Date().toISOString();
    const soonIso = new Date(Date.now() + 48*60*60*1000).toISOString();

    const [activeTrials, expiringSoon, conversions7d] = await Promise.all([
      supabase.rpc("graphql", {}) // placeholder to keep calls parallel
    ]).catch(() => [null, null, null]);

    // Fallback sequential queries for clarity
    const { count: activeTrialsCount } = await supabase
      .from("trials")
      .select("id", { count: "exact", head: true })
      .eq("converted", false)
      .gt("trial_ends_at", nowIso);

    const { count: expiringSoonCount } = await supabase
      .from("trials")
      .select("id", { count: "exact", head: true })
      .eq("converted", false)
      .lte("trial_ends_at", soonIso)
      .gt("trial_ends_at", nowIso);

    const sinceIso = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const { count: conversions7dCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("created_at", sinceIso);

    res.status(200).json({
      activeTrials: activeTrialsCount || 0,
      expiringSoon: expiringSoonCount || 0,
      conversions7d: conversions7dCount || 0
    });
  } catch (e) {
    res.status(200).json({ activeTrials: 0, expiringSoon: 0, conversions7d: 0, error: e?.message });
  }
}
