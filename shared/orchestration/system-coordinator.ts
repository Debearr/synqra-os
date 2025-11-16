/**
 * ============================================================
 * SYSTEM COORDINATOR - NØID LABS
 * ============================================================
 * Central orchestration to prevent clashes, overlaps, and friction
 * 
 * Clear Responsibility Matrix:
 * - Each system has ONE clear job
 * - No duplicate responsibilities
 * - Clean handoffs between systems
 * - No race conditions
 * - No resource contention
 * 
 * Apple/Tesla principle: Simple, clean, conflict-free
 */

import { logger } from "../dev/tools";
import type { App } from "../types";

// ============================================================
// SYSTEM OWNERSHIP MATRIX
// ============================================================

export const SYSTEM_OWNERSHIP = {
  // WHO owns WHAT
  
  "AI Generation": {
    owner: "aiClient",
    responsibilities: [
      "Generate text content",
      "Refine existing content",
      "Multi-version output",
    ],
    does_not: [
      "Store content (that's cache/DB)",
      "Validate content (that's validation pipeline)",
      "Make business decisions (that's decision engine)",
    ],
  },

  "Content Validation": {
    owner: "ValidationPipeline",
    responsibilities: [
      "Check brand voice compliance",
      "Validate content quality",
      "Score content (0-100)",
    ],
    does_not: [
      "Generate content (that's AI client)",
      "Store validation results (that's DB)",
      "Make routing decisions (that's decision engine)",
    ],
  },

  "Caching": {
    owner: "IntelligentCache",
    responsibilities: [
      "Store frequently used content",
      "Return cached results",
      "Manage TTL and eviction",
    ],
    does_not: [
      "Generate new content (that's AI client)",
      "Validate content (that's validation)",
      "Make strategic decisions (that's decision engine)",
    ],
  },

  "Market Intelligence": {
    owner: "MarketIntelligenceEngine",
    responsibilities: [
      "Scrape public data sources",
      "Detect market signals",
      "Identify leads",
      "Track competitors",
    ],
    does_not: [
      "Contact leads (that's n8n workflows)",
      "Make sales decisions (that's decision engine)",
      "Store final decisions (that's DB)",
    ],
  },

  "Lead Scoring": {
    owner: "ScoringEngine",
    responsibilities: [
      "Calculate lead scores",
      "Calculate signal scores",
      "Apply scoring rules",
    ],
    does_not: [
      "Qualify leads (that's evolving agents)",
      "Contact leads (that's n8n)",
      "Store leads (that's DB)",
    ],
  },

  "Decision Making": {
    owner: "DecisionEngine",
    responsibilities: [
      "Decide actions (pursue/monitor/ignore)",
      "Determine priority (urgent/high/medium/low)",
      "Generate reasoning",
    ],
    does_not: [
      "Execute actions (that's n8n or agents)",
      "Generate content (that's AI client)",
      "Store decisions (that's DB)",
    ],
  },

  "Evolving Agents": {
    owner: "AgentFleet",
    responsibilities: [
      "Process user queries autonomously",
      "Learn from feedback",
      "Decide to respond/escalate/clarify",
    ],
    does_not: [
      "Scrape web data (that's market intelligence)",
      "Execute workflows (that's n8n)",
      "Make strategic decisions (that's decision engine)",
    ],
  },

  "Self-Healing": {
    owner: "SelfHealingEngine",
    responsibilities: [
      "Monitor system health",
      "Detect incidents",
      "Auto-fix issues",
    ],
    does_not: [
      "Generate content (that's AI client)",
      "Process leads (that's n8n)",
      "Make business decisions (that's decision engine)",
    ],
  },

  "Workflows (N8N)": {
    owner: "N8N",
    responsibilities: [
      "Execute multi-step processes",
      "Integrate external systems",
      "Coordinate actions across tools",
    ],
    does_not: [
      "Make strategic decisions (that's decision engine)",
      "Generate content directly (calls AI client)",
      "Store business logic (that's shared utilities)",
    ],
  },

  "Database": {
    owner: "Supabase",
    responsibilities: [
      "Store all persistent data",
      "Enforce data integrity",
      "Provide query interface",
    ],
    does_not: [
      "Make decisions (that's decision engine)",
      "Generate content (that's AI client)",
      "Execute workflows (that's n8n)",
    ],
  },
} as const;

// ============================================================
// EXECUTION LOCKS (Prevent Race Conditions)
// ============================================================

class ExecutionLockManager {
  private locks: Map<string, { lockedAt: number; lockedBy: string }> = new Map();
  private lockTimeout = 300000; // 5 minutes

  /**
   * Try to acquire lock
   */
  async acquire(resource: string, owner: string): Promise<boolean> {
    const existing = this.locks.get(resource);

    // Check if lock expired
    if (existing && Date.now() - existing.lockedAt > this.lockTimeout) {
      logger.warn(`Lock expired for ${resource}, releasing`, existing);
      this.locks.delete(resource);
    }

    // Try to acquire
    if (!this.locks.has(resource)) {
      this.locks.set(resource, { lockedAt: Date.now(), lockedBy: owner });
      return true;
    }

    return false;
  }

  /**
   * Release lock
   */
  release(resource: string, owner: string): void {
    const existing = this.locks.get(resource);
    if (existing && existing.lockedBy === owner) {
      this.locks.delete(resource);
    }
  }

  /**
   * Check if locked
   */
  isLocked(resource: string): boolean {
    return this.locks.has(resource);
  }
}

const lockManager = new ExecutionLockManager();

// ============================================================
// SYSTEM COORDINATOR
// ============================================================

export class SystemCoordinator {
  /**
   * Process a lead (coordination pattern)
   * 
   * Clear flow: Market Intel → Scoring → Decision → N8N → Agents
   * NO overlaps, NO conflicts
   */
  static async processLead(leadId: string, app: App): Promise<void> {
    // Acquire lock to prevent duplicate processing
    const lockKey = `lead_${leadId}`;
    const lockAcquired = await lockManager.acquire(lockKey, "processLead");

    if (!lockAcquired) {
      logger.warn(`Lead ${leadId} is already being processed, skipping`);
      return;
    }

    try {
      logger.info(`Processing lead ${leadId}`);

      // Step 1: Fetch lead (Database owns this)
      const { getSupabaseClient } = await import("../db/supabase");
      const supabase = getSupabaseClient();
      const { data: lead, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (error || !lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Step 2: Score lead (ScoringEngine owns this)
      const { ScoringEngine } = await import("../intelligence/decision-engine");
      const fitScore = await ScoringEngine.scoreLeadDynamic(lead, app);

      // Step 3: Decide action (DecisionEngine owns this)
      const { DecisionEngine } = await import("../intelligence/decision-engine");
      const decision = await DecisionEngine.decideLeadAction({
        ...lead,
        fit_score: fitScore,
      });

      // Step 4: Execute action based on decision
      if (decision.action === "pursue") {
        // N8N workflow will handle execution
        await this.triggerN8NWorkflow("lead-intelligence-pipeline", {
          leadId,
          priority: decision.priority,
          actions: decision.recommended_actions,
        });
      } else if (decision.action === "monitor") {
        // Update status only
        await supabase
          .from("leads")
          .update({ status: "monitor", fit_score: fitScore })
          .eq("id", leadId);
      } else {
        // Ignore - mark as discarded
        await supabase
          .from("leads")
          .update({ status: "discarded", fit_score: fitScore })
          .eq("id", leadId);
      }

      logger.info(`Lead ${leadId} processed: ${decision.action} (${decision.priority})`);
    } finally {
      // Always release lock
      lockManager.release(lockKey, "processLead");
    }
  }

  /**
   * Process market signal (coordination pattern)
   * 
   * Clear flow: Market Intel → Filtering → Scoring → Decision → Action
   */
  static async processSignal(signalId: string, app: App): Promise<void> {
    const lockKey = `signal_${signalId}`;
    const lockAcquired = await lockManager.acquire(lockKey, "processSignal");

    if (!lockAcquired) {
      logger.warn(`Signal ${signalId} is already being processed, skipping`);
      return;
    }

    try {
      // Step 1: Fetch signal
      const { getSupabaseClient } = await import("../db/supabase");
      const supabase = getSupabaseClient();
      const { data: signal } = await supabase
        .from("market_signals")
        .select("*")
        .eq("id", signalId)
        .single();

      if (!signal) throw new Error(`Signal not found: ${signalId}`);

      // Step 2: Score signal
      const { ScoringEngine } = await import("../intelligence/decision-engine");
      const score = ScoringEngine.scoreSignal(signal);

      // Step 3: Decide action
      const { DecisionEngine } = await import("../intelligence/decision-engine");
      const decision = await DecisionEngine.decideSignalAction(signal);

      // Step 4: Route based on decision
      if (decision.action === "pursue" && decision.priority === "urgent") {
        // Immediate notification
        await this.notifyTeam(app, "urgent_signal", {
          signal,
          decision,
          score,
        });
      } else if (decision.action === "pursue") {
        // Add to action queue (n8n will process)
        await this.triggerN8NWorkflow("signal-processor", {
          signalId,
          priority: decision.priority,
        });
      }
      // "monitor" and "ignore" handled passively

      logger.info(`Signal ${signalId} processed: ${decision.action} (score: ${score})`);
    } finally {
      lockManager.release(lockKey, "processSignal");
    }
  }

  /**
   * Handle customer query (coordination pattern)
   * 
   * Clear flow: Agent → Decision → N8N (if needed) → Response
   * NO overlap with market intelligence or self-healing
   */
  static async handleCustomerQuery(
    queryText: string,
    customerId: string,
    channel: string,
    app: App
  ): Promise<{ response: string; handledBy: string; escalated: boolean }> {
    const lockKey = `customer_${customerId}_query`;
    const lockAcquired = await lockManager.acquire(lockKey, "handleQuery");

    if (!lockAcquired) {
      // Another query from this customer is being processed
      return {
        response: "We're processing your previous inquiry. One moment please.",
        handledBy: "coordinator",
        escalated: false,
      };
    }

    try {
      // Step 1: Agent processes query (Agent owns this)
      const { processWithAgent } = await import("../autonomous/evolving-agents");
      const decision = await processWithAgent("support", app, queryText, {
        customerId,
        channel,
      });

      if (decision.action === "respond") {
        // Agent handled it - done
        return {
          response: decision.response!,
          handledBy: "agent",
          escalated: false,
        };
      } else if (decision.action === "clarify") {
        // Agent needs clarification
        return {
          response: decision.response!,
          handledBy: "agent",
          escalated: false,
        };
      } else {
        // Escalate to human (n8n workflow)
        await this.triggerN8NWorkflow("support-escalation", {
          queryText,
          customerId,
          channel,
          reason: decision.reasoning,
        });

        return {
          response: "I've escalated your query to our team. They'll respond within 30 minutes.",
          handledBy: "human_escalation",
          escalated: true,
        };
      }
    } finally {
      lockManager.release(lockKey, "handleQuery");
    }
  }

  /**
   * Generate content (coordination pattern)
   * 
   * Clear flow: Cache check → AI generation → Validation → Cache store
   * NO overlap between systems
   */
  static async generateContent(
    prompt: string,
    type: string,
    app: App,
    options?: { useCache?: boolean; validate?: boolean }
  ): Promise<string> {
    const useCache = options?.useCache !== false;
    const validate = options?.validate !== false;

    // Step 1: Check cache (Cache owns this)
    if (useCache) {
      const { contentCache } = await import("../cache/intelligent-cache");
      const cacheKey = `${type}_${prompt}`;
      const cached = await contentCache.get(cacheKey);

      if (cached) {
        logger.debug("Cache hit for content generation");
        return cached;
      }
    }

    // Step 2: Generate (AI client owns this)
    const { generateWithRPRD } = await import("../rprd/patterns");
    const output = await generateWithRPRD({
      content: prompt,
      type: type as any,
      mode: "polished",
      refinePass: true,
    });

    const content = output.refined || output.primary;

    // Step 3: Validate (Validation pipeline owns this)
    if (validate) {
      const { validateContent } = await import("../validation");
      const validation = validateContent(content, type as any);

      if (!validation.passed) {
        throw new Error(`Content validation failed: ${validation.errors.join(", ")}`);
      }
    }

    // Step 4: Cache (Cache owns this)
    if (useCache) {
      const { contentCache } = await import("../cache/intelligent-cache");
      const cacheKey = `${type}_${prompt}`;
      await contentCache.set(cacheKey, content, { ttl: 3600 });
    }

    return content;
  }

  // ============================================================
  // PRIVATE HELPERS (Clean handoffs)
  // ============================================================

  private static async triggerN8NWorkflow(
    workflowName: string,
    payload: any
  ): Promise<void> {
    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        logger.warn("N8N_WEBHOOK_URL not configured, skipping workflow trigger");
        return;
      }

      const response = await fetch(`${webhookUrl}/${workflowName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`N8N workflow trigger failed: ${response.status}`);
      }

      logger.info(`Triggered N8N workflow: ${workflowName}`);
    } catch (error) {
      logger.error(`Failed to trigger N8N workflow: ${workflowName}`, error);
    }
  }

  private static async notifyTeam(
    app: App,
    notificationType: string,
    data: any
  ): Promise<void> {
    // Could integrate with Slack, Discord, email, etc.
    logger.info(`Team notification: ${notificationType}`, data);

    // In production, send to appropriate channel
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[${app}] ${notificationType}`,
          attachments: [{ text: JSON.stringify(data, null, 2) }],
        }),
      });
    }
  }
}

// ============================================================
// CONFLICT PREVENTION RULES
// ============================================================

export const CONFLICT_PREVENTION = {
  // Rule 1: Only ONE system can write to a resource at a time
  "Data Writes": {
    rule: "Use execution locks for all write operations",
    enforcement: "lockManager.acquire() before writes",
    example: "processLead(), processSignal()",
  },

  // Rule 2: Clear ownership of each operation
  "Operation Ownership": {
    rule: "Each operation has ONE owner system",
    enforcement: "See SYSTEM_OWNERSHIP matrix",
    example: "AI generation → aiClient ONLY",
  },

  // Rule 3: No duplicate processing
  "Idempotency": {
    rule: "Use locks and status checks to prevent duplicate work",
    enforcement: "Check status before processing",
    example: "Skip if lead.status === 'processing'",
  },

  // Rule 4: Clean handoffs between systems
  "System Boundaries": {
    rule: "Systems communicate via coordinator or direct calls only",
    enforcement: "Use SystemCoordinator for complex flows",
    example: "Market intel → Coordinator → N8N",
  },

  // Rule 5: No circular dependencies
  "Dependency Direction": {
    rule: "Dependencies flow in one direction only",
    enforcement: "No system imports from downstream systems",
    example: "AI client ← RPRD ← Workflows (never reverse)",
  },
} as const;

// ============================================================
// EXPORTS
// ============================================================

export { lockManager };

/**
 * Check if a resource is currently being processed
 */
export function isProcessing(resource: string): boolean {
  return lockManager.isLocked(resource);
}

/**
 * Get system ownership info
 */
export function getOwner(capability: string): string | undefined {
  for (const [system, config] of Object.entries(SYSTEM_OWNERSHIP)) {
    if (config.responsibilities.includes(capability)) {
      return config.owner;
    }
  }
  return undefined;
}
