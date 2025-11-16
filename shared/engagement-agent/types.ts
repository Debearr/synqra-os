/**
 * ============================================================
 * ENGAGEMENT AGENT TYPES
 * ============================================================
 * Core types for the Human Engagement Agent system
 * 
 * RPRD DNA: Clear, type-safe, modular
 */

export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "reddit"
  | "landing_page";

export type CommentSource = {
  platform: Platform;
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  text: string;
  timestamp: Date;
  parentCommentId?: string; // If this is a reply
  metadata?: {
    likes?: number;
    verified?: boolean;
    followerCount?: number;
    accountAge?: number; // days
  };
};

export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

export type Intent =
  | "question"
  | "feedback"
  | "complaint"
  | "praise"
  | "request_feature"
  | "request_help"
  | "spam"
  | "troll"
  | "buying_signal"
  | "casual"
  | "unclear";

export type Emotion =
  | "happy"
  | "excited"
  | "frustrated"
  | "angry"
  | "confused"
  | "neutral"
  | "sarcastic"
  | "grateful";

export type CommenterType =
  | "potential_customer"
  | "current_user"
  | "troll"
  | "bot"
  | "spammer"
  | "confused_user"
  | "high_value_lead"
  | "general_audience";

export type ProductFit = "synqra" | "noid" | "aurafx" | "unclear" | "none";

export type ToxicityLevel = "safe" | "mild" | "moderate" | "severe" | "extreme";

export type SpamType =
  | "none"
  | "promotional"
  | "scam"
  | "bot"
  | "link_spam"
  | "duplicate"
  | "low_effort";

export type AnalysisResult = {
  sentiment: Sentiment;
  intent: Intent;
  emotion: Emotion;
  commenterType: CommenterType;
  productFit: ProductFit;
  toxicityLevel: ToxicityLevel;
  spamType: SpamType;
  
  // Scores (0-100)
  conversionPotential: number;
  engagementQuality: number;
  responseUrgency: number;
  brandRisk: number;
  
  // Flags
  shouldReply: boolean;
  requiresHumanReview: boolean;
  shouldIgnore: boolean;
  
  // Reasoning
  reasoning: string;
  detectedPatterns: string[];
};

export type ReplyStyle = "helpful" | "witty" | "strategic" | "empathetic" | "brief";

export type GeneratedReply = {
  text: string;
  style: ReplyStyle;
  tone: "premium" | "casual" | "professional";
  includesCTA: boolean;
  ctaType?: "product" | "support" | "content" | "waitlist";
  confidence: number; // 0-100
  alternativeReplies?: string[]; // A/B options
};

export type EngagementLog = {
  id: string;
  platform: Platform;
  commentSource: CommentSource;
  analysis: AnalysisResult;
  generatedReply: GeneratedReply | null;
  replySent: boolean;
  replyTimestamp?: Date;
  
  // Performance tracking
  responseTime: number; // milliseconds
  cost: number; // in cents
  tokensUsed: number;
  
  // Metadata
  agentVersion: string;
  timestamp: Date;
};

export type EngagementMetrics = {
  totalComments: number;
  totalReplies: number;
  averageResponseTime: number;
  averageConversionScore: number;
  
  // By sentiment
  sentimentBreakdown: Record<Sentiment, number>;
  
  // By intent
  intentBreakdown: Record<Intent, number>;
  
  // By commenter type
  commenterTypeBreakdown: Record<CommenterType, number>;
  
  // By product fit
  productFitBreakdown: Record<ProductFit, number>;
  
  // Quality metrics
  spamFiltered: number;
  toxicFiltered: number;
  highValueLeads: number;
  
  // Cost metrics
  totalCost: number;
  totalTokens: number;
  averageCostPerReply: number;
};
