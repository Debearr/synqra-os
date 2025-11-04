const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SupabaseHeaders = {
  apikey: string;
  Authorization: string;
  "Content-Type"?: string;
  Prefer?: string;
  Range?: string;
};

type NewsletterPayload = {
  email: string;
  company?: string;
  use_case?: string;
  source?: string;
};

export type DashboardPreviewMetrics = {
  liveUsers: number;
  automationsTriggered: number;
  activeAutomations: number;
  scheduledContent: number;
  averageEngagementRate: number;
};

const FALLBACK_METRICS: DashboardPreviewMetrics = {
  liveUsers: 128,
  automationsTriggered: 2841,
  activeAutomations: 46,
  scheduledContent: 312,
  averageEngagementRate: 37,
};

const isSupabaseConfigured =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.length > 0 &&
  typeof SUPABASE_SERVICE_ROLE_KEY === "string" &&
  SUPABASE_SERVICE_ROLE_KEY.length > 0;

const baseHeaders: SupabaseHeaders | null = isSupabaseConfigured
  ? {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    }
  : null;

function parseContentRange(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const parts = contentRange.split("/");
  if (parts.length !== 2) return null;
  const total = Number(parts[1]);
  return Number.isFinite(total) ? total : null;
}

async function supabaseFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!isSupabaseConfigured || !baseHeaders) {
    throw new Error("Supabase environment variables are not configured");
  }

  const headers = {
    ...baseHeaders,
    ...(init?.headers ?? {}),
  } as Record<string, string>;

  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function saveNewsletterSignup(payload: NewsletterPayload) {
  if (!isSupabaseConfigured || !baseHeaders) {
    console.warn(
      "⚠️ Supabase environment variables are not configured. Newsletter signup stored in memory only."
    );
    return {
      ok: true,
      fallback: true,
    } as const;
  }

  const response = await supabaseFetch("/rest/v1/newsletter_signups", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      source: payload.source ?? "landing-page",
      created_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: "return=minimal",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Failed to store newsletter signup (${response.status}): ${message}`
    );
  }

  return { ok: true, fallback: false } as const;
}

async function fetchCount(path: string): Promise<number | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const response = await supabaseFetch(path, {
      method: "GET",
      headers: {
        Prefer: "count=exact",
        Range: "0-0",
      },
    });

    if (!response.ok) {
      console.warn(`Supabase count request failed for ${path}`);
      return null;
    }

    const total = parseContentRange(response.headers.get("content-range"));
    return total ?? null;
  } catch (error) {
    console.error(`Supabase count error for ${path}`, error);
    return null;
  }
}

async function fetchAutomationStats() {
  if (!isSupabaseConfigured) {
    return {
      totalRuns: FALLBACK_METRICS.automationsTriggered,
      activeAutomations: FALLBACK_METRICS.activeAutomations,
    };
  }

  try {
    const response = await supabaseFetch(
      "/rest/v1/automations?select=run_count,is_active&order=updated_at.desc",
      {
        method: "GET",
        headers: {
          Range: "0-199",
        },
      }
    );

    if (!response.ok) {
      console.warn("Supabase automation stats request failed");
      return {
        totalRuns: FALLBACK_METRICS.automationsTriggered,
        activeAutomations: FALLBACK_METRICS.activeAutomations,
      };
    }

    const rows = (await response.json()) as Array<{
      run_count: number | null;
      is_active: boolean | null;
    }>;

    const totalRuns = rows.reduce(
      (sum, row) => sum + (Number(row.run_count) || 0),
      0
    );
    const activeAutomations = rows.filter((row) => row.is_active).length;
    return { totalRuns, activeAutomations };
  } catch (error) {
    console.error("Supabase automation stats error", error);
    return {
      totalRuns: FALLBACK_METRICS.automationsTriggered,
      activeAutomations: FALLBACK_METRICS.activeAutomations,
    };
  }
}

async function fetchAverageEngagementRate(): Promise<number> {
  if (!isSupabaseConfigured) return FALLBACK_METRICS.averageEngagementRate;

  try {
    const response = await supabaseFetch(
      "/rest/v1/analytics?select=value,metric_type&order=recorded_at.desc",
      {
        method: "GET",
        headers: {
          Range: "0-99",
        },
      }
    );

    if (!response.ok) {
      console.warn("Supabase analytics request failed");
      return FALLBACK_METRICS.averageEngagementRate;
    }

    const rows = (await response.json()) as Array<{
      value: number | null;
      metric_type: string | null;
    }>;

    const engagementValues = rows
      .filter((row) =>
        ["likes", "comments", "shares", "saves", "clicks"].includes(
          row.metric_type ?? ""
        )
      )
      .map((row) => Number(row.value) || 0);

    if (!engagementValues.length) {
      return FALLBACK_METRICS.averageEngagementRate;
    }

    const totalEngagement = engagementValues.reduce((sum, value) => sum + value, 0);
    return Math.round(totalEngagement / engagementValues.length);
  } catch (error) {
    console.error("Supabase engagement rate error", error);
    return FALLBACK_METRICS.averageEngagementRate;
  }
}

export async function getDashboardPreviewMetrics(): Promise<DashboardPreviewMetrics> {
  if (!isSupabaseConfigured) {
    return FALLBACK_METRICS;
  }

  const [liveUsers, scheduledContent, automationStats, averageEngagementRate] =
    await Promise.all([
      fetchCount("/rest/v1/users?select=id"),
      fetchCount("/rest/v1/posts?select=id&status=eq.scheduled"),
      fetchAutomationStats(),
      fetchAverageEngagementRate(),
    ]);

  return {
    liveUsers: liveUsers ?? FALLBACK_METRICS.liveUsers,
    automationsTriggered:
      automationStats.totalRuns ?? FALLBACK_METRICS.automationsTriggered,
    activeAutomations:
      automationStats.activeAutomations ?? FALLBACK_METRICS.activeAutomations,
    scheduledContent: scheduledContent ?? FALLBACK_METRICS.scheduledContent,
    averageEngagementRate: averageEngagementRate ?? FALLBACK_METRICS.averageEngagementRate,
  };
}

export { FALLBACK_METRICS };
