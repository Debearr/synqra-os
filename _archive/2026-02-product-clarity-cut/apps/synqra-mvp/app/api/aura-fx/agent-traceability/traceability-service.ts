/**
 * Agent Traceability Service
 * Manages immutable audit logs for agent decisions
 *
 * CRITICAL RULES:
 * - Logs are for human audit only
 * - No algorithmic feedback or self-optimization
 * - No user-facing exposure beyond minimal attribution
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import crypto from "crypto";
import type {
  ReasoningSnapshot,
  AgentAttribution,
  AgentTraceabilityRecord,
  AuditLogFilters,
  AuditLogQueryResult,
  ReasoningStep,
  ContextSnapshot,
} from "./types";

export class TraceabilityService {
  private supabase: ReturnType<typeof createClient>;

  constructor(authToken?: string) {
    const headers: Record<string, string> = {};

    if (authToken) {
      headers.Authorization = authToken;
    }

    this.supabase = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: { headers },
      }
    );
  }

  /** Generate prompt version hash */
  static generatePromptHash(templateContent: string): string {
    return crypto
      .createHash("sha256")
      .update(templateContent)
      .digest("hex")
      .substring(0, 16);
  }

  async registerAgentVersion(
    agentName: string,
    version: string,
    role: string,
    capabilities: string[],
    modelUsed: string
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc("register_agent_version", {
      p_agent_name: agentName,
      p_version: version,
      p_role: role,
      p_capabilities: capabilities,
      p_model_used: modelUsed,
    } as unknown as Parameters<typeof this.supabase.rpc>[1]);

    if (error) throw new Error(error.message);
    return data;
  }

  async registerPromptVersion(
    templateName: string,
    templateContent: string,
    parametersSchema: Record<string, unknown>
  ): Promise<string> {
    const versionHash =
      TraceabilityService.generatePromptHash(templateContent);

    const { error } = await this.supabase.rpc(
      "register_prompt_version",
      {
        p_version_hash: versionHash,
        p_template_name: templateName,
        p_template_content: templateContent,
        p_parameters_schema: parametersSchema,
      } as unknown as Parameters<typeof this.supabase.rpc>[1]
    );

    if (error) throw new Error(error.message);
    return versionHash;
  }

  async getAgentAttribution(
    assessmentId: string
  ): Promise<AgentAttribution | null> {
    const { data, error } = await this.supabase.rpc(
      "get_agent_attribution",
      { p_assessment_id: assessmentId } as unknown as Parameters<typeof this.supabase.rpc>[1]
    );

    const rows = Array.isArray(data) ? (data as unknown[]) : [];
    if (error || rows.length === 0) return null;

    const r = rows[0] as {
      agent_count: number;
      primary_agent_name: string;
      version: string;
      generated_at: string;
    };
    return {
      agent_count: r.agent_count,
      primary_agent_name: r.primary_agent_name,
      version: r.version,
      generated_at: r.generated_at,
    };
  }

  async queryAuditLogs(
    filters: AuditLogFilters
  ): Promise<AuditLogQueryResult> {
    const { data, error } = await this.supabase.rpc(
      "query_agent_audit_logs",
      {
        p_assessment_id: filters.assessment_id ?? null,
        p_agent_name: filters.agent_name ?? null,
        p_date_from: filters.date_from ?? null,
        p_date_to: filters.date_to ?? null,
        p_limit: filters.limit ?? 100,
      } as unknown as Parameters<typeof this.supabase.rpc>[1]
    );

    if (error) throw new Error(error.message);

    const rows = Array.isArray(data) ? (data as unknown[]) : [];

    return {
      records: rows as AgentTraceabilityRecord[],
      total_count: rows.length,
      page: 1,
      page_size: filters.limit ?? 100,
    };
  }

  async getReasoningSnapshot(
    snapshotId: string
  ): Promise<ReasoningSnapshot | null> {
    const { data, error } = await this.supabase.rpc(
      "get_reasoning_snapshot",
      { p_snapshot_id: snapshotId } as unknown as Parameters<typeof this.supabase.rpc>[1]
    );

    const rows = Array.isArray(data) ? (data as unknown[]) : [];
    if (error || rows.length === 0) return null;

    const r = rows[0] as {
      id: string;
      assessment_id: string;
      reasoning_chain: ReasoningStep[];
      context_used: ContextSnapshot;
      total_tokens: number;
      model_used: string;
      temperature: number;
      created_at: string;
    };
    return {
      id: r.id,
      assessment_id: r.assessment_id,
      reasoning_chain: r.reasoning_chain,
      context_used: r.context_used,
      total_tokens: r.total_tokens,
      model_used: r.model_used,
      temperature: r.temperature,
      created_at: r.created_at,
      immutable: true,
    };
  }

  static verifyNoAlgorithmicUse(): boolean {
    console.warn(
      "⚠️ AUDIT: Traceability logs must never influence decisions"
    );
    return false;
  }
}
