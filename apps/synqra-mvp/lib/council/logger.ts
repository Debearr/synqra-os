import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "../supabase/env";

function getAuthedClient(token: string) {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function createCouncilSession(options: {
  token: string;
  userId: string;
  title?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  try {
    const client = getAuthedClient(options.token);
    const { data, error } = await client
      .from("council_sessions")
      .insert({
        user_id: options.userId,
        title: options.title ?? null,
        metadata: options.metadata ?? {},
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return "";
    }

    return data.id;
  } catch {
    return "";
  }
}

export async function createCouncilAgent(options: {
  token: string;
  userId: string;
  sessionId: string;
  name: string;
  role?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  try {
    const client = getAuthedClient(options.token);
    const { data, error } = await client
      .from("council_agents")
      .insert({
        session_id: options.sessionId,
        user_id: options.userId,
        name: options.name,
        role: options.role ?? null,
        model: options.model ?? null,
        metadata: options.metadata ?? {},
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return "";
    }

    return data.id;
  } catch {
    return "";
  }
}

export async function logCouncilMessage(options: {
  token: string;
  userId: string;
  sessionId: string;
  role: string;
  content: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const client = getAuthedClient(options.token);
    await client.from("council_messages").insert({
      session_id: options.sessionId,
      agent_id: options.agentId ?? null,
      user_id: options.userId,
      role: options.role,
      content: options.content,
      metadata: options.metadata ?? {},
    });
  } catch {
    return;
  }
}

export async function countRecentSessions(options: {
  token: string;
  userId: string;
  sinceIso: string;
}): Promise<number> {
  try {
    const client = getAuthedClient(options.token);
    const { count } = await client
      .from("council_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", options.userId)
      .gte("created_at", options.sinceIso);

    return count ?? 0;
  } catch {
    return 0;
  }
}
