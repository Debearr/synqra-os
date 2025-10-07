//  Live Data Bridge for AuraFX ↔ Synqra Animation (resilient, no hard deps)

export async function getLiveMetrics(brand) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const BREVO_API = process.env.BREVO_API;

  // fetch: prefer global, fallback to node-fetch if available
  let doFetch = (typeof fetch !== 'undefined') ? fetch : null;
  if (!doFetch) {
    try {
      const mod = await import('node-fetch');
      doFetch = mod.default || mod;
    } catch (_) {
      // leave as null; we'll skip Brevo if fetch unavailable
    }
  }

  // Supabase client (optional)
  let supabase = null;
  try {
    const mod = await import('@supabase/supabase-js');
    const { createClient } = mod;
    if (SUPABASE_URL && SUPABASE_KEY && typeof createClient === 'function') {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (_) {
    // supabase optional
  }

  // 1️⃣ Pull latest engagement metrics from Supabase
  let engagement = [];
  if (supabase) {
    try {
      const { data: metrics } = await supabase
        .from('synqra_metrics')
        .select('pillar, engagement_rate, confidence')
        .eq('brand', brand)
        .order('created_at', { ascending: false })
        .limit(10);
      engagement = metrics || [];
    } catch (_) {
      engagement = [];
    }
  }

  // 2️⃣ Pull Brevo campaign stats
  let brevo = [];
  if (doFetch && BREVO_API) {
    try {
      const res = await doFetch('https://api.brevo.com/v3/emailCampaigns', {
        headers: { 'api-key': BREVO_API }
      });
      const campaigns = await res.json();
      brevo = campaigns.campaigns?.slice(0, 5) || [];
    } catch (_) {
      brevo = [];
    }
  }

  // 3️⃣ Merge and normalize data
  return {
    brand,
    engagement,
    brevo,
    timestamp: new Date().toISOString()
  };
}

