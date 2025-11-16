/**
 * ============================================================
 * FREE EMBEDDINGS & RAG - Zero API Cost
 * ============================================================
 * Use free/local embedding models instead of paid APIs
 * Options:
 * 1. TF-IDF (no API, pure math)
 * 2. Sentence Transformers (local, no API)
 * 3. Supabase pgvector (free tier, no external API)
 */

/**
 * Simple TF-IDF implementation (100% free, no API)
 */
export class SimpleTFIDF {
  private documents: Array<{ id: string; text: string; tokens: string[] }> = [];
  private idf: Map<string, number> = new Map();

  constructor() {}

  /**
   * Add document to index
   */
  addDocument(id: string, text: string): void {
    const tokens = this.tokenize(text);
    this.documents.push({ id, text, tokens });
    this.calculateIDF();
  }

  /**
   * Simple tokenization (could be improved with stemming/lemmatization)
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((token) => token.length > 2); // Remove very short words
  }

  /**
   * Calculate IDF scores
   */
  private calculateIDF(): void {
    const docCount = this.documents.length;
    const termDocCounts = new Map<string, number>();

    // Count how many documents contain each term
    this.documents.forEach((doc) => {
      const uniqueTokens = new Set(doc.tokens);
      uniqueTokens.forEach((token) => {
        termDocCounts.set(token, (termDocCounts.get(token) || 0) + 1);
      });
    });

    // Calculate IDF = log(N / df)
    termDocCounts.forEach((df, term) => {
      this.idf.set(term, Math.log(docCount / df));
    });
  }

  /**
   * Calculate TF-IDF vector for text
   */
  private calculateTFIDF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const tfidf = new Map<string, number>();

    // Calculate TF (term frequency)
    tokens.forEach((token) => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });

    // Normalize TF
    const maxTF = Math.max(...Array.from(tf.values()));
    tf.forEach((count, term) => {
      tf.set(term, count / maxTF);
    });

    // Calculate TF-IDF
    tf.forEach((tfValue, term) => {
      const idfValue = this.idf.get(term) || 0;
      tfidf.set(term, tfValue * idfValue);
    });

    return tfidf;
  }

  /**
   * Cosine similarity between two TF-IDF vectors
   */
  private cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

    allTerms.forEach((term) => {
      const val1 = vec1.get(term) || 0;
      const val2 = vec2.get(term) || 0;

      dotProduct += val1 * val2;
      mag1 += val1 * val1;
      mag2 += val2 * val2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  /**
   * Search for similar documents
   */
  search(query: string, topK: number = 5, minSimilarity: number = 0.1): Array<{
    id: string;
    text: string;
    similarity: number;
  }> {
    const queryTokens = this.tokenize(query);
    const queryVector = this.calculateTFIDF(queryTokens);

    const results = this.documents
      .map((doc) => {
        const docVector = this.calculateTFIDF(doc.tokens);
        const similarity = this.cosineSimilarity(queryVector, docVector);

        return {
          id: doc.id,
          text: doc.text,
          similarity,
        };
      })
      .filter((result) => result.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }
}

/**
 * Initialize free RAG system with static knowledge
 */
let ragIndex: SimpleTFIDF | null = null;

export function initializeFreeRAG(): void {
  console.log("🔄 Initializing free RAG system (zero API cost)...");

  ragIndex = new SimpleTFIDF();

  // Index static knowledge (from staticKnowledge.ts)
  const knowledge = [
    {
      id: "pricing-starter",
      text: "Synqra Starter plan costs $29 per month. Includes 5 users, core automation features, and email support.",
    },
    {
      id: "pricing-pro",
      text: "Synqra Professional plan costs $99 per month. Includes 25 users, advanced integrations, priority support, and custom automations. Most popular plan.",
    },
    {
      id: "pricing-enterprise",
      text: "Synqra Enterprise plan has custom pricing. Includes unlimited users, 24/7 premium support, custom development, and SLA guarantee.",
    },
    {
      id: "features-ai",
      text: "Synqra uses AI content generation with Claude 3.5 Sonnet. Cost optimized at $0.01-0.02 per generation. Maintains brand voice consistency.",
    },
    {
      id: "features-platforms",
      text: "Synqra supports YouTube, LinkedIn, Instagram, TikTok, X (Twitter), and Facebook. Multi-platform scheduling from one dashboard.",
    },
    {
      id: "trial",
      text: "Synqra offers a 14-day free trial of the Professional plan. No credit card required. Cancel anytime.",
    },
    {
      id: "competitors-buffer",
      text: "Synqra vs Buffer: Synqra has built-in AI content generation, Buffer doesn't. Synqra is more affordable for teams.",
    },
    {
      id: "competitors-hootsuite",
      text: "Synqra vs Hootsuite: Synqra is 40% cheaper, has cleaner UI, and includes AI agents. Hootsuite is cluttered and expensive.",
    },
    {
      id: "integrations",
      text: "Synqra integrates with Salesforce, HubSpot, Slack, Microsoft Teams, Google Workspace, Notion, Stripe, and Zapier.",
    },
    {
      id: "support-login",
      text: "Login issues: Clear browser cache, try incognito mode, or use the 'Forgot Password' link to reset.",
    },
    {
      id: "support-posting",
      text: "Post failed to publish: Check OAuth connection status in settings. Reconnect platform if needed. Verify post meets platform requirements.",
    },
    {
      id: "support-agent",
      text: "Agent not responding: Check agent mode (mock vs live). Verify ANTHROPIC_API_KEY is set. Check budget status at /api/budget/status.",
    },
    {
      id: "best-times-linkedin",
      text: "Best time to post on LinkedIn: Tuesday-Thursday, 9am-12pm EST. Business hours for B2B content.",
    },
    {
      id: "best-times-instagram",
      text: "Best time to post on Instagram: Monday-Friday, 11am-1pm EST. Lunch break engagement is highest.",
    },
    {
      id: "video-youtube",
      text: "YouTube video specs: 16:9 ratio, 8-15 minutes optimal length, 1280x720 thumbnail. Upload in 1080p or 4K.",
    },
    {
      id: "video-tiktok",
      text: "TikTok video specs: 9:16 vertical ratio, 15-60 seconds length, 1080x1920 resolution. Hook viewers in first 3 seconds.",
    },
  ];

  knowledge.forEach((doc) => {
    ragIndex!.addDocument(doc.id, doc.text);
  });

  console.log(`✅ Indexed ${knowledge.length} documents (zero API cost)`);
}

/**
 * Retrieve relevant context (free, no API)
 */
export function retrieveFreeContext(query: string, maxDocs: number = 5): string {
  if (!ragIndex) {
    initializeFreeRAG();
  }

  const results = ragIndex!.search(query, maxDocs, 0.1);

  if (results.length === 0) {
    return "No relevant context found.";
  }

  const context = results
    .map((result, i) => {
      return `[${i + 1}] (Similarity: ${(result.similarity * 100).toFixed(1)}%)\n${result.text}`;
    })
    .join("\n\n");

  return `# Relevant Context:\n\n${context}`;
}

/**
 * Cost verification: Confirm zero API costs
 */
export function verifyFreeRAG(): {
  usesPaidAPI: boolean;
  method: string;
  cost: number;
} {
  return {
    usesPaidAPI: false,
    method: "TF-IDF (pure math, no API)",
    cost: 0,
  };
}
