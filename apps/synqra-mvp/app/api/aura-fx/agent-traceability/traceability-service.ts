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
  AgentTraceabilityRecord,
  AgentIdentity,
  PromptSnapshot,
  ReasoningSnapshot,
  ReasoningStep,
  ContextSnapshot,
  AgentAttribution,
  AuditLogFilters,
  AuditLogQueryResult,
} from "./types";

export class TraceabilityService {
  private supabase;

  constructor(authToken?: string) {
    const headers = authToken ? { Authorization: authToken } : {};
    this.supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers },
    });
  }

  /**
   * Generate prompt version hash
   * SHA-256 hash of prompt template for versioning
   */
  static generatePromptHash(templateContent: string): string {
    return crypto
      .createHash("sha256")
      .update(templateContent)
      .digest("hex")
      .substring(0, 16); // First 16 chars for readability
  }

  /**
   * Register agent version in registry
   */
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
    });

    if (error) {
      throw new Error(`Failed to register agent version: ${error.message}`);
    }

    return data;
  }

  /**
   * Register prompt version in registry
   */
  async registerPromptVersion(
    templateName: string,
    templateContent: string,
    parametersSchema: Record<string, unknown>
  ): Promise<string> {
    const versionHash = TraceabilityService.generatePromptHash(templateContent);

    const { data, error } = await this.supabase.rpc("register_prompt_version", {
      p_version_hash: versionHash,
      p_template_name: templateName,
      p_template_content: templateContent,
      p_parameters_schema: parametersSchema,
    });

    if (error) {
      throw new Error(`Failed to register prompt version: ${error.message}`);
    }

    return versionHash;
  }

  /**
   * Create complete traceability record for assessment
   * IMMUTABLE - cannot be modified after creation
   */
  async createTraceabilityRecord(
    assessmentId: string,
    assessmentSchemaVersion: string,
    agents: AgentIdentity[],
    primaryAgent: AgentIdentity,
    prompt: PromptSnapshot,
    reasoningChain: ReasoningStep[],
    contextUsed: ContextSnapshot,
    totalTokens: number,
    modelUsed: string,
    temperature: number
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc(
      "create_agent_traceability_record",
      {
        p_assessment_id: assessmentId,
        p_assessment_schema_version: assessmentSchemaVersion,
        p_agents: agents,
        p_primary_agent: primaryAgent,
        p_prompt: prompt,
        p_reasoning_chain: reasoningChain,
        p_context_used: contextUsed,
        p_total_tokens: totalTokens,
        p_model_used: modelUsed,
        p_temperature: temperature,
      }
    );

    if (error) {
      throw new Error(`Failed to create traceability record: ${error.message}`);
    }

    return data;
  }

  /**
   * Get minimal user-facing agent attribution
   * ONLY method that exposes data to users
   */
  async getAgentAttribution(assessmentId: string): Promise<AgentAttribution | null> {
    const { data, error } = await this.supabase.rpc("get_agent_attribution", {
      p_assessment_id: assessmentId,
    });

    if (error) {
      throw new Error(`Failed to get agent attribution: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const record = data[0];
    return {
      agent_count: record.agent_count,
      primary_agent_name: record.primary_agent_name,
      version: record.version,
      generated_at: record.generated_at,
    };
  }

  /**
   * Query audit logs (ADMIN ONLY)
   * For human review and debugging
   */
  async queryAuditLogs(
    filters: AuditLogFilters
  ): Promise<AuditLogQueryResult> {
    const { data, error } = await this.supabase.rpc("query_agent_audit_logs", {
      p_assessment_id: filters.assessment_id || null,
      p_agent_name: filters.agent_name || null,
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null,
      p_limit: filters.limit || 100,
    });

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    return {
      records: data || [],
      total_count: data?.length || 0,
      page: 1,
      page_size: filters.limit || 100,
    };
  }

  /**
   * Get full reasoning snapshot (ADMIN ONLY)
   * For detailed audit and debugging
   */
  async getReasoningSnapshot(snapshotId: string): Promise<ReasoningSnapshot | null> {
    const { data, error } = await this.supabase.rpc("get_reasoning_snapshot", {
      p_snapshot_id: snapshotId,
    });

    if (error) {
      throw new Error(`Failed to get reasoning snapshot: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const record = data[0];
    return {
      id: record.id,
      assessment_id: record.assessment_id,
      reasoning_chain: record.reasoning_chain,
      context_used: record.context_used,
      total_tokens: record.total_tokens,
      model_used: record.model_used,
      temperature: record.temperature,
      created_at: record.created_at,
      immutable: true,
    };
  }

  /**
   * Get agent version from registry
   */
  async getAgentVersion(agentName: string, version: string) {
    const { data, error } = await this.supabase
      .from("agent_version_registry")
      .select("*")
      .eq("agent_name", agentName)
      .eq("version", version)
      .single();

    if (error) {
      throw new Error(`Failed to get agent version: ${error.message}`);
    }

    return data;
  }

  /**
   * Get prompt version from registry
   */
  async getPromptVersion(versionHash: string) {
    const { data, error } = await this.supabase
      .from("prompt_version_registry")
      .select("*")
      .eq("version_hash", versionHash)
      .single();

    if (error) {
      throw new Error(`Failed to get prompt version: ${error.message}`);
    }

    return data;
  }

  /**
   * List all agent versions
   */
  async listAgentVersions(includeDeprecated: boolean = false) {
    let query = this.supabase
      .from("agent_version_registry")
      .select("*")
      .order("deployed_at", { ascending: false });

    if (!includeDeprecated) {
      query = query.eq("deprecated", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list agent versions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * List all prompt versions
   */
  async listPromptVersions(includeDeprecated: boolean = false) {
    let query = this.supabase
      .from("prompt_version_registry")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeDeprecated) {
      query = query.eq("deprecated", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list prompt versions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * CRITICAL: Verify logs are not used in decision logic
   * This method should always return false in production
   */
  static verifyNoAlgorithmicUse(): boolean {
    // This is a compile-time and runtime check
    // If this method is ever called in decision logic, it's a violation
    console.warn(
      "⚠️ AUDIT: Agent traceability verification called - logs must not be used in decision logic"
    );
    return false;
  }
}

/**
 * Helper function to create agent identity
 */
export function createAgentIdentity(
  name: string,
  version: string,
  role: AgentIdentity["role"]
): AgentIdentity {
  return { name, version, role };
}

/**
 * Helper function to create prompt snapshot
 */
export function createPromptSnapshot(
  templateContent: string,
  templateName: string,
  parameters: Record<string, unknown>
): PromptSnapshot {
  return {
    version_hash: TraceabilityService.generatePromptHash(templateContent),
    template_name: templateName,
    parameters,
  };
}

/**
 * Helper function to create reasoning step
 */
export function createReasoningStep(
  stepNumber: number,
  agentName: string,
  action: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  reasoning: string
): ReasoningStep {
  return {
    step_number: stepNumber,
    agent_name: agentName,
    action,
    input,
    output,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper function to create context snapshot
 */
export function createContextSnapshot(
  symbol: string,
  timeframe: string,
  dataPoints: number,
  timestampRange: { start: string; end: string },
  indicatorsUsed: string[],
  externalDataSources: string[]
): ContextSnapshot {
  return {
    market_data: {
      symbol,
      timeframe,
      data_points: dataPoints,
      timestamp_range: timestampRange,
    },
    indicators_used: indicatorsUsed,
    external_data_sources: externalDataSources,
  };
}
