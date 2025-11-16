/**
 * ============================================================
 * DE BEAR TONE ENGINE
 * ============================================================
 * Generates replies in De Bear's exact human tone
 * 
 * CHARACTERISTICS:
 * - Clear, direct, premium
 * - Witty, relatable, masculine charisma
 * - Emotionally intelligent
 * - Never robotic, never corporate
 * - Helpful and strategic
 * 
 * RPRD DNA: Authentic, premium, consistent
 */

export type ToneProfile = {
  clarity: number; // 0-100 (higher = more direct)
  warmth: number; // 0-100 (higher = more friendly)
  wit: number; // 0-100 (higher = more playful)
  authority: number; // 0-100 (higher = more confident)
  brevity: number; // 0-100 (higher = more concise)
};

/**
 * De Bear's signature tone profile
 */
export const DE_BEAR_TONE: ToneProfile = {
  clarity: 95, // Extremely direct
  warmth: 75, // Friendly but not overly casual
  wit: 80, // Witty and engaging
  authority: 90, // Confident and knowledgeable
  brevity: 85, // Concise, no fluff
};

/**
 * Tone templates by context
 */
export const TONE_TEMPLATES = {
  // When answering questions
  helpful: {
    tone: DE_BEAR_TONE,
    patterns: [
      "Here's what you need:",
      "Let me break this down:",
      "Quick answer:",
      "Exactly. Here's how:",
      "That's a great question.",
    ],
    avoid: [
      "I hope this helps!",
      "Feel free to reach out",
      "Thank you for your question",
      "We appreciate your feedback",
    ],
  },

  // When being witty/playful
  witty: {
    tone: { ...DE_BEAR_TONE, wit: 95, warmth: 85 },
    patterns: [
      "Funny you mention that—",
      "Plot twist:",
      "Here's the thing:",
      "Real talk:",
      "Not gonna lie,",
    ],
    avoid: [
      "LOL",
      "That's hilarious!",
      "You're so right!",
      "OMG yes",
    ],
  },

  // When being strategic/premium
  strategic: {
    tone: { ...DE_BEAR_TONE, authority: 95, clarity: 100 },
    patterns: [
      "Here's what most people miss:",
      "The smart move is:",
      "Strategic perspective:",
      "From experience:",
      "Here's why that matters:",
    ],
    avoid: [
      "In my humble opinion",
      "You might want to consider",
      "Perhaps you could try",
      "I think maybe",
    ],
  },

  // When being empathetic
  empathetic: {
    tone: { ...DE_BEAR_TONE, warmth: 90, wit: 50 },
    patterns: [
      "I hear you.",
      "That's frustrating.",
      "Makes sense why you'd feel that way.",
      "Completely understand.",
      "You're not wrong about that.",
    ],
    avoid: [
      "I'm sorry you feel that way",
      "We apologize for the inconvenience",
      "Thank you for bringing this to our attention",
      "Your feedback is valuable",
    ],
  },

  // When being brief/direct
  brief: {
    tone: { ...DE_BEAR_TONE, brevity: 100, clarity: 100 },
    patterns: [
      "Yes.",
      "No.",
      "Exactly.",
      "Correct.",
      "Done.",
    ],
    avoid: [
      "Yes, absolutely!",
      "No, unfortunately not",
      "I would say yes",
      "The answer is no",
    ],
  },
};

/**
 * Brand voice rules (NEVER violate)
 */
export const BRAND_VOICE_RULES = {
  always: [
    "Be direct and clear",
    "Use active voice",
    "Write like you talk",
    "Show personality",
    "Be helpful first",
    "Maintain premium feel",
    "Use specific details",
    "Respect user's time",
  ],
  
  never: [
    "Use corporate jargon",
    "Sound like a robot",
    "Use exclamation marks excessively",
    "Say 'Sorry for the inconvenience'",
    "Use 'utilize' instead of 'use'",
    "Start with 'Thank you for...'",
    "Use 'reach out' or 'touch base'",
    "Sound overly formal or stiff",
    "Use emoji (except strategically)",
    "Use ALL CAPS for emphasis",
  ],
};

/**
 * Conversation openers (context-aware)
 */
export const CONVERSATION_OPENERS = {
  question: [
    "Quick answer:",
    "Here's what you need:",
    "Let me break this down:",
    "Short version:",
  ],
  
  feedback: [
    "Appreciate the feedback.",
    "Good point.",
    "That's fair.",
    "You're right about that.",
  ],
  
  complaint: [
    "I hear you.",
    "That's frustrating.",
    "Completely understand.",
    "Fair concern.",
  ],
  
  praise: [
    "Glad it's working for you.",
    "That's what we're here for.",
    "Appreciate you saying that.",
    "That's the goal.",
  ],
  
  buying_signal: [
    "Let's get you set up.",
    "Here's what you need to know:",
    "Perfect timing.",
    "Here's the move:",
  ],
};

/**
 * Conversation closers (context-aware)
 */
export const CONVERSATION_CLOSERS = {
  helpful: [
    "Let me know if that helps.",
    "Holler if you need more.",
    "Hit me up if stuck.",
    "Anything else, just ask.",
  ],
  
  strategic: [
    "That's the play.",
    "Execute on that.",
    "Make it happen.",
    "Go time.",
  ],
  
  brief: [
    "Done.",
    "Sorted.",
    "That's it.",
    "There you go.",
  ],
  
  empathetic: [
    "Hope that clears it up.",
    "Let me know how it goes.",
    "We're here if you need us.",
    "Rooting for you.",
  ],
};

/**
 * Word substitutions (premium → De Bear style)
 */
export const WORD_SUBSTITUTIONS: Record<string, string> = {
  // Corporate → Natural
  "utilize": "use",
  "leverage": "use",
  "synergy": "teamwork",
  "touch base": "talk",
  "circle back": "follow up",
  "reach out": "message",
  "going forward": "from now on",
  "at the end of the day": "basically",
  
  // Overly formal → Direct
  "assist you with": "help you",
  "in order to": "to",
  "due to the fact that": "because",
  "at this point in time": "now",
  "in the event that": "if",
  
  // Weak → Strong
  "I think": "Here's what:",
  "I believe": "Here's what:",
  "In my opinion": "From experience:",
  "Perhaps": "Consider",
  "Maybe": "Try",
};

/**
 * Tone strength indicators (for validation)
 */
export const TONE_INDICATORS = {
  // Signs of weak corporate tone (bad)
  weak: [
    /thank you for (reaching out|contacting|your)/i,
    /we appreciate (your|the)/i,
    /sorry for (the|any) inconvenience/i,
    /feel free to/i,
    /please don't hesitate/i,
    /at your earliest convenience/i,
  ],
  
  // Signs of strong De Bear tone (good)
  strong: [
    /^(quick answer|here's what|let me break)/i,
    /real talk|here's the thing|plot twist/i,
    /^(yes\.|no\.|exactly\.|correct\.)/i,
    /makes sense|i hear you|fair (point|concern)/i,
  ],
};

/**
 * Validate tone compliance
 */
export function validateTone(text: string): {
  compliant: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check for weak corporate language
  for (const pattern of TONE_INDICATORS.weak) {
    if (pattern.test(text)) {
      issues.push(`Corporate language detected: ${pattern.source}`);
      score -= 15;
    }
  }

  // Check for forbidden words/phrases
  for (const [weak, strong] of Object.entries(WORD_SUBSTITUTIONS)) {
    if (text.toLowerCase().includes(weak)) {
      issues.push(`Use "${strong}" instead of "${weak}"`);
      score -= 5;
    }
  }

  // Check for excessive punctuation
  if ((text.match(/!/g) || []).length > 1) {
    issues.push("Too many exclamation marks");
    score -= 10;
  }

  // Check for ALL CAPS (except acronyms)
  const capsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
  const validCaps = ["AI", "API", "CEO", "CTO", "UI", "UX", "ROI", "ARR"];
  const invalidCaps = capsWords.filter((w) => !validCaps.includes(w));
  if (invalidCaps.length > 0) {
    issues.push("Avoid ALL CAPS for emphasis");
    score -= 10;
  }

  // Check for passive voice (simple check)
  if (/\b(was|were|been|being)\b.*\b(done|made|created|sent)\b/i.test(text)) {
    issues.push("Use active voice");
    suggestions.push("Rewrite in active voice");
    score -= 5;
  }

  // Check for strong tone indicators (bonus points)
  let strongCount = 0;
  for (const pattern of TONE_INDICATORS.strong) {
    if (pattern.test(text)) {
      strongCount++;
    }
  }
  if (strongCount > 0) {
    score = Math.min(100, score + strongCount * 5);
  }

  return {
    compliant: score >= 80,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

/**
 * Get opener for context
 */
export function getOpener(intent: string): string {
  const openers = CONVERSATION_OPENERS[intent as keyof typeof CONVERSATION_OPENERS];
  if (!openers || openers.length === 0) {
    return CONVERSATION_OPENERS.question[0]; // Default
  }
  return openers[Math.floor(Math.random() * openers.length)];
}

/**
 * Get closer for style
 */
export function getCloser(style: "helpful" | "strategic" | "brief" | "empathetic"): string {
  const closers = CONVERSATION_CLOSERS[style];
  if (!closers || closers.length === 0) {
    return ""; // No closer
  }
  return closers[Math.floor(Math.random() * closers.length)];
}
