import { 
  AgentRole, 
  ResponseTier,
  AgentConfirmationGate,
  createAgentConfirmationGate,
  validateAgentConfirmation,
} from "../base/types";

/**
 * ============================================================
 * AGENT ROUTER
 * ============================================================
 * Intelligent routing to determine which agent should handle a request.
 * 
 * HUMAN-IN-COMMAND: This router only determines intent and routing.
 * Actual agent invocation requires explicit human confirmation via
 * a valid AgentConfirmationGate passed to the agent's invoke method.
 */

// Re-export confirmation utilities for consumers
export { createAgentConfirmationGate, validateAgentConfirmation };
export type { AgentConfirmationGate };

interface RoutingResult {
  agent: AgentRole;
  confidence: number;
  reason: string;
  responseTier: ResponseTier; // Smart token budget allocation
  
  /**
   * HUMAN-IN-COMMAND: Reminder that agent invocation requires confirmation.
   * This is always true - no agent can execute without human approval.
   */
  requiresConfirmation: true;
}

/**
 * Keywords for each agent type
 */
const ROUTING_KEYWORDS = {
  sales: [
    "pricing",
    "cost",
    "buy",
    "purchase",
    "demo",
    "trial",
    "plan",
    "upgrade",
    "quote",
    "roi",
    "features",
    "how does",
    "what can",
    "interested in",
    "tell me about",
    "sales",
    "contact sales",
  ],
  support: [
    "error",
    "issue",
    "problem",
    "bug",
    "not working",
    "broken",
    "help",
    "fix",
    "troubleshoot",
    "can't",
    "cannot",
    "won't",
    "failed",
    "crash",
    "down",
    "support",
    "technical",
  ],
  service: [
    "account",
    "billing",
    "invoice",
    "payment",
    "subscription",
    "cancel",
    "refund",
    "change plan",
    "downgrade",
    "user",
    "settings",
    "feedback",
    "suggestion",
    "request",
    "feature request",
  ],
};

/**
 * Analyze message content and route to appropriate agent
 */
export function routeToAgent(message: string): RoutingResult {
  const lowerMessage = message.toLowerCase();

  // Count keyword matches for each agent
  const scores = {
    sales: 0,
    support: 0,
    service: 0,
  };

  // Score based on keyword matches
  for (const [agent, keywords] of Object.entries(ROUTING_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[agent as AgentRole] += 1;
      }
    }
  }

  // Question patterns
  const isQuestion =
    lowerMessage.includes("?") ||
    lowerMessage.startsWith("how ") ||
    lowerMessage.startsWith("what ") ||
    lowerMessage.startsWith("why ") ||
    lowerMessage.startsWith("when ") ||
    lowerMessage.startsWith("where ") ||
    lowerMessage.startsWith("can ") ||
    lowerMessage.startsWith("do you ");

  // Problem indicators
  const isProblem =
    lowerMessage.includes("error") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("problem") ||
    lowerMessage.includes("not working") ||
    lowerMessage.includes("broken");

  // Sales indicators
  const isSales =
    lowerMessage.includes("pricing") ||
    lowerMessage.includes("buy") ||
    lowerMessage.includes("demo") ||
    lowerMessage.includes("trial");

  // Boost scores based on patterns
  if (isProblem) scores.support += 3;
  if (isSales) scores.sales += 3;
  if (isQuestion && !isProblem && !isSales) scores.sales += 1;

  // Determine winner
  const maxScore = Math.max(scores.sales, scores.support, scores.service);
  let selectedAgent: AgentRole = "sales"; // default
  let reason = "General inquiry - routed to sales";

  if (maxScore === 0) {
    // No clear match - default to sales
    selectedAgent = "sales";
    reason = "No specific keywords detected - defaulting to sales agent";
  } else if (scores.support === maxScore) {
    selectedAgent = "support";
    reason = "Technical issue or problem detected";
  } else if (scores.service === maxScore) {
    selectedAgent = "service";
    reason = "Account or billing inquiry detected";
  } else if (scores.sales === maxScore) {
    selectedAgent = "sales";
    reason = "Sales or product inquiry detected";
  }

  // Calculate confidence (0-1)
  const totalScore = scores.sales + scores.support + scores.service;
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.5;

  // Determine response tier based on message complexity
  const responseTier = determineResponseTier(message);

  return {
    agent: selectedAgent,
    confidence,
    reason,
    responseTier,
    // HUMAN-IN-COMMAND: Always require confirmation before agent execution
    requiresConfirmation: true,
  };
}

/**
 * Determine optimal response tier for cost optimization
 * - "quick" (300 tokens): Simple yes/no, quick facts
 * - "standard" (600 tokens): Normal inquiries
 * - "detailed" (1024 tokens): Complex, multi-part questions
 */
function determineResponseTier(message: string): ResponseTier {
  const lowerMessage = message.toLowerCase();
  
  // Simple queries get quick responses
  const simpleIndicators = [
    "yes or no",
    "true or false",
    "what is",
    "when is",
    "who is",
    "define",
    "status",
    "available",
    "open",
    "closed",
  ];
  
  const isSimple = simpleIndicators.some(ind => lowerMessage.includes(ind)) &&
                   message.length < 100;
  
  if (isSimple) return "quick";
  
  // Complex queries need detailed responses
  const complexIndicators = [
    "explain",
    "how to",
    "step by step",
    "detailed",
    "compare",
    "difference between",
    "pros and cons",
    "comprehensive",
    "walk me through",
    "tutorial",
  ];
  
  const questionCount = (message.match(/\?/g) || []).length;
  const hasMultipleQuestions = questionCount > 1;
  const isLongMessage = message.length > 200;
  const hasComplexIndicator = complexIndicators.some(ind => lowerMessage.includes(ind));
  
  if (hasMultipleQuestions || isLongMessage || hasComplexIndicator) {
    return "detailed";
  }
  
  // Default to standard
  return "standard";
}

/**
 * Get routing suggestions based on message content
 */
export function getRoutingSuggestions(message: string): {
  primary: AgentRole;
  secondary?: AgentRole;
  reasoning: string;
} {
  const result = routeToAgent(message);

  // Find second best option
  const lowerMessage = message.toLowerCase();
  const scores = {
    sales: 0,
    support: 0,
    service: 0,
  };

  for (const [agent, keywords] of Object.entries(ROUTING_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[agent as AgentRole] += 1;
      }
    }
  }

  const sortedAgents = (Object.keys(scores) as AgentRole[]).sort(
    (a, b) => scores[b] - scores[a]
  );

  return {
    primary: result.agent,
    secondary: sortedAgents[1] !== result.agent ? sortedAgents[1] : undefined,
    reasoning: result.reason,
  };
}

/**
 * Check if message should be escalated to human
 */
export function shouldEscalateToHuman(message: string): {
  shouldEscalate: boolean;
  reason?: string;
} {
  const lowerMessage = message.toLowerCase();

  // Escalation triggers
  const escalationKeywords = [
    "speak to a person",
    "talk to human",
    "real person",
    "manager",
    "supervisor",
    "representative",
    "agent",
    "human support",
    "urgent",
    "emergency",
    "critical",
    "lawsuit",
    "legal",
    "lawyer",
  ];

  for (const keyword of escalationKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        shouldEscalate: true,
        reason: `Customer requested ${keyword}`,
      };
    }
  }

  // Check for excessive frustration
  const frustrationIndicators = ["terrible", "worst", "horrible", "furious", "angry"];
  let frustrationCount = 0;
  for (const indicator of frustrationIndicators) {
    if (lowerMessage.includes(indicator)) frustrationCount++;
  }

  if (frustrationCount >= 2) {
    return {
      shouldEscalate: true,
      reason: "High frustration level detected",
    };
  }

  return {
    shouldEscalate: false,
  };
}

/**
 * Analyze sentiment of the message
 */
export function analyzeSentiment(message: string): {
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
} {
  const lowerMessage = message.toLowerCase();

  const positiveWords = [
    "great",
    "excellent",
    "good",
    "thank",
    "thanks",
    "love",
    "amazing",
    "wonderful",
    "perfect",
    "awesome",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "horrible",
    "worst",
    "hate",
    "awful",
    "disappointed",
    "frustrat",
    "angry",
    "problem",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (lowerMessage.includes(word)) positiveCount++;
  }

  for (const word of negativeWords) {
    if (lowerMessage.includes(word)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let confidence = 0.5;

  if (total > 0) {
    if (positiveCount > negativeCount) {
      sentiment = "positive";
      confidence = positiveCount / total;
    } else if (negativeCount > positiveCount) {
      sentiment = "negative";
      confidence = negativeCount / total;
    }
  }

  return { sentiment, confidence };
}
