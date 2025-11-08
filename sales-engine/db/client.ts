import { getSupabaseServiceKey, getSupabaseUrl } from "../config";
import type { CacheEntry, LeadPayload, LeadStatus, QualificationResult, SalesEventType } from "../types";

type FetchMethod = "GET" | "POST" | "PATCH";

type FetchOptions<TBody = unknown> = {
  method?: FetchMethod;
  body?: TBody;
  query?: Record<string, string>;
  prefer?: string;
};

type SupabaseResponse<T> = {
  data?: T;
  error?: string;
  status?: number;
};

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function buildUrl(path: string, query?: Record<string, string>) {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    return undefined;
  }
  const url = new URL(path, baseUrl);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function supabaseFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<SupabaseResponse<T>> {
  const targetUrl = buildUrl(path, options.query);
  const serviceKey = getSupabaseServiceKey();

  if (!targetUrl || !serviceKey) {
    return { error: "Supabase configuration is incomplete" };
  }

  try {
    const response = await fetch(targetUrl, {
      method: options.method ?? "GET",
      headers: {
        ...DEFAULT_HEADERS,
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        ...(options.prefer ? { Prefer: options.prefer } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        error: errorBody || response.statusText,
        status: response.status,
      };
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return { data: await response.json(), status: response.status };
    }

    return { data: (await response.text()) as unknown as T, status: response.status };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function insertLead(payload: LeadPayload) {
  return supabaseFetch("/rest/v1/leads", {
    method: "POST",
    body: [
      {
        ...payload,
        source: payload.source ?? "unknown",
        status: ("new" satisfies LeadStatus),
      },
    ],
    prefer: "return=representation",
  });
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  return supabaseFetch(`/rest/v1/leads`, {
    method: "PATCH",
    query: { id: `eq.${leadId}` },
    body: { status },
    prefer: "return=representation",
  });
}

export async function upsertLeadScore(leadId: string, score: QualificationResult) {
  return supabaseFetch("/rest/v1/lead_scores", {
    method: "POST",
    body: [
      {
        lead_id: leadId,
        score: score.score,
        tier: score.tier,
        rationale: score.rationale,
        recommended_next_step: score.recommendedNextStep,
        ai_model: score.aiModel,
        ai_session_id: score.aiSessionId ?? null,
        updated_at: new Date().toISOString(),
      },
    ],
    prefer: "resolution=merge-duplicates,return=representation",
  });
}

export async function logSalesEvent(params: {
  leadId?: string;
  userId?: string;
  type: SalesEventType;
  payload?: Record<string, unknown>;
}) {
  return supabaseFetch("/rest/v1/sales_events", {
    method: "POST",
    body: [
      {
        lead_id: params.leadId ?? null,
        user_id: params.userId ?? null,
        event_type: params.type,
        payload: params.payload ?? {},
        recorded_at: new Date().toISOString(),
      },
    ],
    prefer: "return=minimal",
  });
}

export async function recordAiSession(params: {
  leadId?: string;
  model: string;
  prompt: string;
  response: string;
}) {
  return supabaseFetch("/rest/v1/ai_sessions", {
    method: "POST",
    body: [
      {
        lead_id: params.leadId ?? null,
        model: params.model,
        prompt: params.prompt,
        response: params.response,
        created_at: new Date().toISOString(),
      },
    ],
    prefer: "return=minimal",
  });
}

export async function writeCacheEntry(entry: CacheEntry) {
  const row = {
    key: entry.key,
    value: entry.value,
    scope: entry.scope ?? "system",
    expires_at: entry.expiresAt,
  };

  return supabaseFetch("/rest/v1/system_cache", {
    method: "POST",
    body: [row],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

export async function readCacheEntry(key: string) {
  const response = await supabaseFetch<
    Array<{ key: string; value: unknown; scope?: string; expires_at: string }>
  >(`/rest/v1/system_cache`, {
    method: "GET",
    query: { key: `eq.${key}`, limit: "1" },
  });

  if (response.data?.[0]) {
    const row = response.data[0];
    const mapped: CacheEntry = {
      key: row.key,
      value: row.value,
      scope: row.scope ?? "system",
      expiresAt: row.expires_at,
    };
    return { ...response, data: [mapped] };
  }

  return response as SupabaseResponse<CacheEntry[]>;
}

export async function fetchLeadByEmail(email: string) {
  return supabaseFetch(`/rest/v1/leads`, {
    query: { email: `eq.${email}`, limit: "1" },
  });
}

export async function recordUserMemory(payload: {
  userId: string;
  actor: string;
  summary: string;
  tags?: string[];
}) {
  return supabaseFetch("/rest/v1/user_memory", {
    method: "POST",
    body: [
      {
        user_id: payload.userId,
        actor: payload.actor,
        summary: payload.summary,
        tags: payload.tags ?? [],
        created_at: new Date().toISOString(),
      },
    ],
    prefer: "return=minimal",
  });
}
