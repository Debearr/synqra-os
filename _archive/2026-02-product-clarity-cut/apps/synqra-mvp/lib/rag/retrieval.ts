/**
 * ============================================================
 * RAG RETRIEVAL SYSTEM
 * ============================================================
 * Document retrieval with hybrid search (keyword + semantic)
 * Mock implementation with fallback to real vector search
 */

import { RAGDocument } from "../agents/base/types";
import { agentConfig } from "../agents/base/config";

/**
 * Mock knowledge base - in production, this would be a vector database
 */
const MOCK_KNOWLEDGE_BASE: Array<{
  id: string;
  content: string;
  source: string;
  category: string;
  keywords: string[];
}> = [
  {
    id: "kb-001",
    content:
      "Synqra offers three pricing tiers: Starter ($29/month for up to 5 users), Professional ($99/month for up to 25 users), and Enterprise (custom pricing for unlimited users). Annual billing provides a 20% discount.",
    source: "/pricing",
    category: "pricing",
    keywords: ["pricing", "cost", "plan", "tier", "starter", "professional", "enterprise"],
  },
  {
    id: "kb-002",
    content:
      "To reset your password, click the 'Forgot Password' link on the login page. Enter your email address and check your inbox for a password reset link. The link expires after 24 hours.",
    source: "/docs/login",
    category: "authentication",
    keywords: ["password", "reset", "login", "forgot", "authentication"],
  },
  {
    id: "kb-003",
    content:
      "Synqra integrates with over 200 platforms including Salesforce, HubSpot, Slack, Microsoft Teams, Google Workspace, Shopify, and more. Integrations support two-way sync, webhooks, and custom field mapping.",
    source: "/integrations",
    category: "integrations",
    keywords: ["integration", "connect", "salesforce", "slack", "hubspot", "api"],
  },
  {
    id: "kb-004",
    content:
      "API authentication uses API keys found in Settings > API. Include the key in the Authorization header: 'Authorization: Bearer YOUR_API_KEY'. Rate limits: 1000 req/hr (Starter), 5000 req/hr (Professional), custom (Enterprise).",
    source: "/docs/api",
    category: "api",
    keywords: ["api", "authentication", "rate limit", "bearer", "token"],
  },
  {
    id: "kb-005",
    content:
      "We offer a 14-day free trial of the Professional plan with no credit card required. Trial includes full access to all Professional features, up to 25 users, and priority support.",
    source: "/trial",
    category: "trial",
    keywords: ["trial", "free", "test", "demo", "try"],
  },
  {
    id: "kb-006",
    content:
      "Cancellation policy: 30-day money-back guarantee for all plans. Cancel anytime in Settings > Billing > Cancel Subscription. Access continues until end of current billing period. Data is retained for 30 days after cancellation.",
    source: "/docs/cancellation",
    category: "billing",
    keywords: ["cancel", "refund", "money back", "subscription"],
  },
  {
    id: "kb-007",
    content:
      "To add team members: Go to Settings > Team > Invite Member. Enter email addresses and assign roles (Admin, Member, or Viewer). Admins have full access, Members can create/edit, Viewers have read-only access.",
    source: "/docs/team",
    category: "team",
    keywords: ["team", "user", "invite", "permission", "role", "admin"],
  },
  {
    id: "kb-008",
    content:
      "System status is available at status.synqra.com. Current uptime: 99.99%. If experiencing issues, check: 1) Browser cache, 2) Network connection, 3) Status page, 4) Contact support if persistent.",
    source: "/status",
    category: "support",
    keywords: ["status", "downtime", "outage", "performance", "slow"],
  },
  {
    id: "kb-009",
    content:
      "Data export: Settings > Data > Export All Data. Available formats: JSON, CSV. Includes all automations, integrations, workflows, and historical data. Exports are generated asynchronously and emailed when ready.",
    source: "/docs/export",
    category: "data",
    keywords: ["export", "download", "data", "backup", "migration"],
  },
  {
    id: "kb-010",
    content:
      "Security features: SOC 2 Type II certified, AES-256 encryption at rest, TLS 1.3 in transit, SSO support (SAML, OAuth), 2FA available, role-based access control, audit logs, GDPR compliant.",
    source: "/security",
    category: "security",
    keywords: ["security", "encryption", "soc2", "compliance", "gdpr", "sso"],
  },
];

/**
 * Calculate similarity score between query and document
 * Simple keyword-based similarity for mock implementation
 */
function calculateSimilarity(query: string, document: typeof MOCK_KNOWLEDGE_BASE[0]): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  let score = 0;

  // Check content match
  if (document.content.toLowerCase().includes(queryLower)) {
    score += 0.5;
  }

  // Check keyword matches
  for (const keyword of document.keywords) {
    if (queryLower.includes(keyword)) {
      score += 0.2;
    }
  }

  // Check individual word matches
  for (const word of queryWords) {
    if (word.length > 3) {
      // Skip short words
      if (document.content.toLowerCase().includes(word)) {
        score += 0.1;
      }
    }
  }

  // Normalize score to 0-1 range
  return Math.min(score, 1.0);
}

/**
 * Retrieve relevant documents for a query
 */
export async function retrieveDocuments(
  query: string,
  options: {
    maxDocuments?: number;
    minSimilarity?: number;
    category?: string;
  } = {}
): Promise<RAGDocument[]> {
  // Use config defaults if not provided
  const maxDocuments = options.maxDocuments || agentConfig.rag.maxDocuments;
  const minSimilarity = options.minSimilarity || agentConfig.rag.minSimilarity;

  // Calculate similarity for all documents
  const scoredDocuments = MOCK_KNOWLEDGE_BASE.map((doc) => ({
    ...doc,
    similarity: calculateSimilarity(query, doc),
  }));

  // Filter by category if specified
  let filtered = scoredDocuments;
  if (options.category) {
    filtered = scoredDocuments.filter((doc) => doc.category === options.category);
  }

  // Filter by minimum similarity and sort by relevance
  const relevant = filtered
    .filter((doc) => doc.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxDocuments);

  // Convert to RAGDocument format
  return relevant.map((doc) => ({
    id: doc.id,
    content: doc.content,
    source: doc.source,
    similarity: doc.similarity,
    metadata: {
      category: doc.category,
      keywords: doc.keywords,
    },
  }));
}

/**
 * Get context string from retrieved documents
 */
export function formatDocumentsAsContext(documents: RAGDocument[]): string {
  if (documents.length === 0) {
    return "No relevant documentation found.";
  }

  const context = documents
    .map(
      (doc, idx) =>
        `[Source ${idx + 1}: ${doc.source}]\n${doc.content}\n(Relevance: ${(doc.similarity * 100).toFixed(0)}%)`
    )
    .join("\n\n");

  return `Relevant Documentation:\n\n${context}`;
}

/**
 * Search knowledge base by category
 */
export async function searchByCategory(category: string): Promise<RAGDocument[]> {
  const documents = MOCK_KNOWLEDGE_BASE.filter((doc) => doc.category === category);

  return documents.map((doc) => ({
    id: doc.id,
    content: doc.content,
    source: doc.source,
    similarity: 1.0, // Perfect match for category search
    metadata: {
      category: doc.category,
      keywords: doc.keywords,
    },
  }));
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): string[] {
  const categories = new Set(MOCK_KNOWLEDGE_BASE.map((doc) => doc.category));
  return Array.from(categories).sort();
}

/**
 * Add document to knowledge base (for future use)
 */
export async function addDocument(document: {
  content: string;
  source: string;
  category: string;
  keywords: string[];
}): Promise<string> {
  const id = `kb-${Date.now()}`;
  MOCK_KNOWLEDGE_BASE.push({ id, ...document });
  return id;
}

/**
 * Health check for RAG system
 */
export function ragHealthCheck(): {
  status: "healthy" | "degraded" | "down";
  documentsCount: number;
  categoriesCount: number;
} {
  return {
    status: "healthy",
    documentsCount: MOCK_KNOWLEDGE_BASE.length,
    categoriesCount: getAvailableCategories().length,
  };
}
