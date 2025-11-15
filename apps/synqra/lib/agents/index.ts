/**
 * ============================================================
 * SYNQRA AGENT SYSTEM - MAIN EXPORT
 * ============================================================
 * Complete multi-agent voice system for Sales, Support, and Service
 */

// Export base classes and types
export { BaseAgent } from "./base/agent";
export { agentConfig, validateConfig, logConfigStatus } from "./base/config";
export * from "./base/types";

// Export specialized agents
export { salesAgent, SalesAgent } from "./sales/salesAgent";
export { supportAgent, SupportAgent } from "./support/supportAgent";
export { serviceAgent, ServiceAgent } from "./service/serviceAgent";

// Export shared utilities
export { conversationMemory, ConversationMemory } from "./shared/memory";
export { AGENT_PERSONAS } from "./shared/personaPresets";
export {
  ALL_TOOLS,
  SALES_TOOLS,
  SUPPORT_TOOLS,
  SERVICE_TOOLS,
} from "./shared/tools";
export {
  routeToAgent,
  getRoutingSuggestions,
  shouldEscalateToHuman,
  analyzeSentiment,
} from "./shared/router";

// Agent registry
import { salesAgent } from "./sales/salesAgent";
import { supportAgent } from "./support/supportAgent";
import { serviceAgent } from "./service/serviceAgent";
import { AgentRole } from "./base/types";
import { BaseAgent } from "./base/agent";

export const AGENT_REGISTRY: Record<AgentRole, BaseAgent> = {
  sales: salesAgent,
  support: supportAgent,
  service: serviceAgent,
};

/**
 * Get agent by role
 */
export function getAgent(role: AgentRole): BaseAgent {
  return AGENT_REGISTRY[role];
}

/**
 * Get all available agents
 */
export function getAllAgents(): BaseAgent[] {
  return Object.values(AGENT_REGISTRY);
}

/**
 * Get agent info by role
 */
export function getAgentInfo(role: AgentRole) {
  return AGENT_REGISTRY[role].getInfo();
}
