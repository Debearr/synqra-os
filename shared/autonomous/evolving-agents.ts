/**
 * ============================================================
 * EVOLVING AGENTS - NØID LABS
 * ============================================================
 * Self-improving AI agents that learn from every interaction
 * and become authority-level performers.
 * 
 * SpaceX/Tesla principle:
 * - Agents learn from real-world usage
 * - Continuously improve without retraining
 * - Make confident decisions autonomously
 * - Escalate only when necessary
 * - Build expertise over time
 * 
 * Goal: Agents become best-in-class through experience
 */

import { aiClient } from "../ai/client";
import { getSupabaseClient, logIntelligence } from "../db/supabase";
import { validateContent } from "../validation";
import { logger } from "../dev/tools";
import type { App, AgentRole } from "../types";

// ============================================================
// TYPES
// ============================================================

export interface AgentProfile {
  id: string;
  role: AgentRole;
  app: App;
  expertise_level: number; // 0-100
  total_interactions: number;
  successful_interactions: number;
  success_rate: number;
  confidence_threshold: number; // When to escalate
  specializations: string[]; // What they're good at
  learning_rate: number; // How fast they adapt
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AgentInteraction {
  id?: string;
  agent_id: string;
  input: string;
  output: string;
  confidence: number;
  user_feedback?: "positive" | "negative" | "neutral";
  escalated: boolean;
  resolution_quality: number; // 0-100
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface AgentDecision {
  action: "respond" | "escalate" | "clarify";
  confidence: number;
  reasoning: string;
  response?: string;
}

export interface LearningPattern {
  pattern_type: string;
  input_pattern: string;
  successful_output: string;
  success_count: number;
  failure_count: number;
  confidence: number;
}

// ============================================================
// EVOLVING AGENT CLASS
// ============================================================

export class EvolvingAgent {
  private profile: AgentProfile;
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private recentInteractions: AgentInteraction[] = [];

  constructor(profile: AgentProfile) {
    this.profile = profile;
    this.loadLearningPatterns();
  }

  /**
   * Process a request with autonomous decision-making
   */
  async process(input: string, context?: Record<string, any>): Promise<AgentDecision> {
    logger.debug(`Agent ${this.profile.role} processing request`, { input });

    // Step 1: Analyze confidence
    const confidence = await this.assessConfidence(input);

    // Step 2: Decide on action
    if (confidence < this.profile.confidence_threshold) {
      // Low confidence - escalate to human
      logger.warn(`Agent ${this.profile.role} escalating (confidence: ${confidence})`);
      return {
        action: "escalate",
        confidence,
        reasoning: `Confidence ${confidence}% below threshold ${this.profile.confidence_threshold}%`,
      };
    }

    if (confidence < 70 && this.needsClarification(input)) {
      // Medium confidence - ask for clarification
      return {
        action: "clarify",
        confidence,
        reasoning: "Input ambiguous, requesting clarification",
        response: await this.generateClarificationRequest(input),
      };
    }

    // Step 3: Check learning patterns first (fast path)
    const patternMatch = this.findMatchingPattern(input);
    if (patternMatch && patternMatch.confidence >= 85) {
      logger.info(`Using learned pattern (confidence: ${patternMatch.confidence}%)`);
      
      const interaction: AgentInteraction = {
        agent_id: this.profile.id,
        input,
        output: patternMatch.successful_output,
        confidence: patternMatch.confidence,
        escalated: false,
        resolution_quality: 90,
        metadata: { source: "learned_pattern", pattern_type: patternMatch.pattern_type },
      };

      await this.recordInteraction(interaction);

      return {
        action: "respond",
        confidence: patternMatch.confidence,
        reasoning: "High-confidence learned pattern",
        response: patternMatch.successful_output,
      };
    }

    // Step 4: Generate new response with AI
    const response = await this.generateResponse(input, context);

    // Step 5: Validate quality
    const validation = this.validateResponse(response, input);
    if (!validation.passed) {
      logger.warn(`Response validation failed`, validation.issues);
      return {
        action: "escalate",
        confidence: 0,
        reasoning: `Validation failed: ${validation.issues.join(", ")}`,
      };
    }

    // Step 6: Record interaction for learning
    const interaction: AgentInteraction = {
      agent_id: this.profile.id,
      input,
      output: response,
      confidence,
      escalated: false,
      resolution_quality: validation.quality,
      metadata: { validation_score: validation.quality },
    };

    await this.recordInteraction(interaction);

    return {
      action: "respond",
      confidence,
      reasoning: "Generated high-quality response",
      response,
    };
  }

  /**
   * Learn from feedback (continuous improvement)
   */
  async learn(
    interactionId: string,
    feedback: "positive" | "negative" | "neutral",
    actualOutcome?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();

    // Update interaction with feedback
    await supabase
      .from("agent_interactions")
      .update({ user_feedback: feedback })
      .eq("id", interactionId);

    // Extract learning pattern
    const { data: interaction } = await supabase
      .from("agent_interactions")
      .select("*")
      .eq("id", interactionId)
      .single();

    if (!interaction) return;

    if (feedback === "positive") {
      // Strengthen this pattern
      await this.reinforcePattern(interaction.input, interaction.output);
      this.profile.successful_interactions++;
    } else if (feedback === "negative") {
      // Weaken or remove this pattern
      await this.weakenPattern(interaction.input);
      
      // If actualOutcome provided, learn the correct response
      if (actualOutcome) {
        await this.reinforcePattern(interaction.input, actualOutcome);
      }
    }

    // Update agent profile
    this.profile.total_interactions++;
    this.profile.success_rate = (this.profile.successful_interactions / this.profile.total_interactions) * 100;
    
    // Increase expertise level based on successful interactions
    if (feedback === "positive") {
      this.profile.expertise_level = Math.min(100, this.profile.expertise_level + 0.1);
    }

    // Adjust confidence threshold dynamically
    if (this.profile.success_rate > 95) {
      // Very high success rate - can be more confident
      this.profile.confidence_threshold = Math.max(60, this.profile.confidence_threshold - 1);
    } else if (this.profile.success_rate < 80) {
      // Lower success rate - be more cautious
      this.profile.confidence_threshold = Math.min(85, this.profile.confidence_threshold + 1);
    }

    await this.saveProfile();

    logger.info(`Agent learned from feedback`, {
      feedback,
      expertiseLevel: this.profile.expertise_level,
      successRate: this.profile.success_rate,
      confidenceThreshold: this.profile.confidence_threshold,
    });
  }

  /**
   * Evolve agent based on performance data
   */
  async evolve(): Promise<{
    upgraded: boolean;
    newVersion: number;
    improvements: string[];
  }> {
    const improvements: string[] = [];

    // Check if ready to evolve (enough interactions with high success rate)
    if (this.profile.total_interactions < 100) {
      return { upgraded: false, newVersion: this.profile.version, improvements: [] };
    }

    // Analyze recent performance
    const recentSuccessRate = this.calculateRecentSuccessRate();

    if (recentSuccessRate >= 90) {
      // Performance is excellent - upgrade
      this.profile.version++;
      this.profile.expertise_level = Math.min(100, this.profile.expertise_level + 5);
      improvements.push("Increased expertise level");

      // Unlock new specializations based on patterns
      const newSpecializations = await this.identifySpecializations();
      for (const spec of newSpecializations) {
        if (!this.profile.specializations.includes(spec)) {
          this.profile.specializations.push(spec);
          improvements.push(`New specialization: ${spec}`);
        }
      }

      // Optimize learning rate
      this.profile.learning_rate = Math.min(1.0, this.profile.learning_rate * 1.1);
      improvements.push("Optimized learning rate");

      await this.saveProfile();

      logger.info(`Agent evolved to version ${this.profile.version}`, improvements);

      return {
        upgraded: true,
        newVersion: this.profile.version,
        improvements,
      };
    }

    return { upgraded: false, newVersion: this.profile.version, improvements: [] };
  }

  /**
   * Get agent stats for monitoring
   */
  getStats(): {
    role: AgentRole;
    expertiseLevel: number;
    totalInteractions: number;
    successRate: number;
    confidenceThreshold: number;
    specializations: string[];
    version: number;
    learnedPatterns: number;
  } {
    return {
      role: this.profile.role,
      expertiseLevel: this.profile.expertise_level,
      totalInteractions: this.profile.total_interactions,
      successRate: this.profile.success_rate,
      confidenceThreshold: this.profile.confidence_threshold,
      specializations: this.profile.specializations,
      version: this.profile.version,
      learnedPatterns: this.learningPatterns.size,
    };
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Assess confidence in handling this input
   */
  private async assessConfidence(input: string): Promise<number> {
    let confidence = 70; // Base confidence

    // Check if we have similar successful patterns
    const pattern = this.findMatchingPattern(input);
    if (pattern) {
      confidence = pattern.confidence;
    }

    // Check input clarity
    if (input.trim().length < 10) {
      confidence -= 20; // Very short input
    }

    // Check if it matches our specializations
    for (const spec of this.profile.specializations) {
      if (input.toLowerCase().includes(spec.toLowerCase())) {
        confidence += 10;
      }
    }

    // Factor in agent expertise
    confidence += this.profile.expertise_level * 0.2;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Find matching learned pattern
   */
  private findMatchingPattern(input: string): LearningPattern | null {
    const normalized = input.toLowerCase().trim();

    for (const pattern of this.learningPatterns.values()) {
      const patternNormalized = pattern.input_pattern.toLowerCase();
      
      // Calculate similarity (simple word overlap)
      const inputWords = new Set(normalized.split(/\s+/));
      const patternWords = new Set(patternNormalized.split(/\s+/));
      const intersection = new Set([...inputWords].filter((w) => patternWords.has(w)));
      const similarity = intersection.size / Math.max(inputWords.size, patternWords.size);

      if (similarity >= 0.7) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Generate response using AI
   */
  private async generateResponse(input: string, context?: Record<string, any>): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();

    const result = await aiClient.generate({
      prompt: input,
      systemPrompt,
      taskType: "strategic",
      mode: "polished",
      metadata: {
        agent_role: this.profile.role,
        expertise_level: this.profile.expertise_level,
      },
    });

    return result.content;
  }

  /**
   * Build system prompt based on agent profile
   */
  private buildSystemPrompt(): string {
    const { SYSTEM_PROMPTS } = require("../prompts/library");
    const basePrompt = SYSTEM_PROMPTS[this.profile.role] || SYSTEM_PROMPTS.strategist;

    let prompt = basePrompt;

    // Add specializations
    if (this.profile.specializations.length > 0) {
      prompt += `\n\nSpecializations: ${this.profile.specializations.join(", ")}`;
    }

    // Add expertise level context
    if (this.profile.expertise_level >= 80) {
      prompt += `\n\nYou are an expert-level agent with ${this.profile.total_interactions} successful interactions.`;
    }

    return prompt;
  }

  /**
   * Validate response quality
   */
  private validateResponse(response: string, input: string): {
    passed: boolean;
    quality: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let quality = 100;

    // Length check
    if (response.length < 20) {
      issues.push("Response too short");
      quality -= 30;
    }

    // Relevance check (simple heuristic)
    const inputWords = new Set(input.toLowerCase().split(/\s+/));
    const responseWords = new Set(response.toLowerCase().split(/\s+/));
    const overlap = new Set([...inputWords].filter((w) => responseWords.has(w)));
    
    if (overlap.size / inputWords.size < 0.2) {
      issues.push("Response may not be relevant");
      quality -= 20;
    }

    // Brand voice check
    const { quickBrandCheck } = require("../validation");
    const brandCheck = quickBrandCheck(response);
    if (!brandCheck.passed) {
      issues.push(...brandCheck.issues);
      quality -= 15;
    }

    return {
      passed: issues.length === 0 && quality >= 60,
      quality: Math.max(0, quality),
      issues,
    };
  }

  /**
   * Check if input needs clarification
   */
  private needsClarification(input: string): boolean {
    // Too short
    if (input.trim().length < 15) return true;

    // Contains question words without context
    const questionWords = ["what", "how", "when", "where", "why", "which"];
    const hasQuestion = questionWords.some((w) => input.toLowerCase().includes(w));
    const hasContext = input.length > 50;

    return hasQuestion && !hasContext;
  }

  /**
   * Generate clarification request
   */
  private async generateClarificationRequest(input: string): Promise<string> {
    return `I want to help you with that, but I need a bit more context. Could you provide more details about: "${input}"?`;
  }

  /**
   * Reinforce a successful pattern
   */
  private async reinforcePattern(input: string, output: string): Promise<void> {
    const key = this.normalizeInput(input);
    
    let pattern = this.learningPatterns.get(key);
    if (!pattern) {
      pattern = {
        pattern_type: "response",
        input_pattern: input,
        successful_output: output,
        success_count: 0,
        failure_count: 0,
        confidence: 50,
      };
    }

    pattern.success_count++;
    pattern.confidence = Math.min(100, 50 + (pattern.success_count / (pattern.success_count + pattern.failure_count)) * 50);

    this.learningPatterns.set(key, pattern);

    // Persist to database
    const supabase = getSupabaseClient();
    await supabase.from("learning_patterns").upsert({
      agent_id: this.profile.id,
      ...pattern,
    });
  }

  /**
   * Weaken a failed pattern
   */
  private async weakenPattern(input: string): Promise<void> {
    const key = this.normalizeInput(input);
    const pattern = this.learningPatterns.get(key);

    if (pattern) {
      pattern.failure_count++;
      pattern.confidence = Math.max(0, 50 + (pattern.success_count / (pattern.success_count + pattern.failure_count)) * 50);

      // Remove if confidence drops too low
      if (pattern.confidence < 30) {
        this.learningPatterns.delete(key);
        
        const supabase = getSupabaseClient();
        await supabase
          .from("learning_patterns")
          .delete()
          .eq("agent_id", this.profile.id)
          .eq("input_pattern", input);
      } else {
        this.learningPatterns.set(key, pattern);
      }
    }
  }

  /**
   * Load learning patterns from database
   */
  private async loadLearningPatterns(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("learning_patterns")
        .select("*")
        .eq("agent_id", this.profile.id)
        .gte("confidence", 70);

      if (data) {
        for (const pattern of data) {
          const key = this.normalizeInput(pattern.input_pattern);
          this.learningPatterns.set(key, pattern);
        }
      }

      logger.debug(`Loaded ${this.learningPatterns.size} learning patterns for agent ${this.profile.id}`);
    } catch (error) {
      logger.error("Failed to load learning patterns", error);
    }
  }

  /**
   * Record interaction for analysis
   */
  private async recordInteraction(interaction: AgentInteraction): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("agent_interactions").insert({
        ...interaction,
        created_at: new Date().toISOString(),
      });

      this.recentInteractions.push(interaction);
      if (this.recentInteractions.length > 100) {
        this.recentInteractions.shift();
      }
    } catch (error) {
      logger.error("Failed to record interaction", error);
    }
  }

  /**
   * Calculate recent success rate (last 50 interactions)
   */
  private calculateRecentSuccessRate(): number {
    if (this.recentInteractions.length === 0) return 0;

    const recent = this.recentInteractions.slice(-50);
    const successful = recent.filter((i) => 
      i.user_feedback === "positive" || 
      (!i.escalated && i.resolution_quality >= 80)
    ).length;

    return (successful / recent.length) * 100;
  }

  /**
   * Identify new specializations from patterns
   */
  private async identifySpecializations(): Promise<string[]> {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("agent_interactions")
      .select("input, metadata")
      .eq("agent_id", this.profile.id)
      .eq("user_feedback", "positive")
      .limit(100);

    if (!data) return [];

    // Extract common topics/keywords
    const keywords = new Map<string, number>();
    
    for (const interaction of data) {
      const words = interaction.input.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 5) { // Only meaningful words
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      }
    }

    // Return top keywords as specializations
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Save agent profile
   */
  private async saveProfile(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("agent_profiles").upsert({
        ...this.profile,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to save agent profile", error);
    }
  }

  /**
   * Normalize input for pattern matching
   */
  private normalizeInput(input: string): string {
    return input.toLowerCase().trim().replace(/\s+/g, " ");
  }
}

// ============================================================
// AGENT FLEET MANAGER
// ============================================================

export class AgentFleetManager {
  private agents: Map<string, EvolvingAgent> = new Map();

  /**
   * Get or create an agent
   */
  async getAgent(role: AgentRole, app: App): Promise<EvolvingAgent> {
    const key = `${app}_${role}`;

    if (!this.agents.has(key)) {
      const profile = await this.loadOrCreateProfile(role, app);
      this.agents.set(key, new EvolvingAgent(profile));
    }

    return this.agents.get(key)!;
  }

  /**
   * Evolve all agents (run periodically)
   */
  async evolveAllAgents(): Promise<void> {
    logger.info(`Evolving ${this.agents.size} agents`);

    for (const [key, agent] of this.agents.entries()) {
      try {
        const result = await agent.evolve();
        if (result.upgraded) {
          logger.info(`Agent ${key} evolved to v${result.newVersion}`, result.improvements);
        }
      } catch (error) {
        logger.error(`Failed to evolve agent ${key}`, error);
      }
    }
  }

  /**
   * Get fleet stats
   */
  getFleetStats(): Array<ReturnType<EvolvingAgent["getStats"]>> {
    return Array.from(this.agents.values()).map((agent) => agent.getStats());
  }

  /**
   * Load or create agent profile
   */
  private async loadOrCreateProfile(role: AgentRole, app: App): Promise<AgentProfile> {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("agent_profiles")
      .select("*")
      .eq("role", role)
      .eq("app", app)
      .single();

    if (data) {
      return data as AgentProfile;
    }

    // Create new profile
    const newProfile: AgentProfile = {
      id: `${app}_${role}_${Date.now()}`,
      role,
      app,
      expertise_level: 50,
      total_interactions: 0,
      successful_interactions: 0,
      success_rate: 100,
      confidence_threshold: 75,
      specializations: [],
      learning_rate: 0.5,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from("agent_profiles").insert(newProfile);

    return newProfile;
  }
}

// ============================================================
// GLOBAL FLEET MANAGER
// ============================================================

export const agentFleet = new AgentFleetManager();

/**
 * Process request with autonomous agent
 */
export async function processWithAgent(
  role: AgentRole,
  app: App,
  input: string,
  context?: Record<string, any>
): Promise<AgentDecision> {
  const agent = await agentFleet.getAgent(role, app);
  return agent.process(input, context);
}

/**
 * Provide feedback to agent (for learning)
 */
export async function provideFeedback(
  interactionId: string,
  feedback: "positive" | "negative" | "neutral",
  actualOutcome?: string
): Promise<void> {
  // Find the agent that handled this interaction
  const supabase = getSupabaseClient();
  const { data: interaction } = await supabase
    .from("agent_interactions")
    .select("agent_id")
    .eq("id", interactionId)
    .single();

  if (!interaction) return;

  // Get the agent and provide feedback
  for (const agent of (agentFleet as any).agents.values()) {
    if ((agent as any).profile.id === interaction.agent_id) {
      await agent.learn(interactionId, feedback, actualOutcome);
      break;
    }
  }
}
