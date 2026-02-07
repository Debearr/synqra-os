export const DISCIPLINE_RULES = {
  maxResponseWords: 150,
  forbiddenPreambles: [
    "I'd be happy to",
    "I can help you with",
    "Let me explain",
    "Thank you for",
    "Here's what I found",
    "Based on my understanding",
  ],
  allowedExceptions: {
    userRequests: ["detailed", "explain fully", "comprehensive"],
    taskTypes: ["exec-summary", "documentation"],
  },
  enforcementMode: "strict" as "strict" | "lenient",
};

/**
 * Append response discipline rules to a base prompt.
 * Skips enforcement when taskType is allowlisted.
 */
export function buildDisciplinedPrompt(
  basePrompt: string,
  taskType?: string,
  userRequest?: string
): string {
  const skip =
    (taskType && DISCIPLINE_RULES.allowedExceptions.taskTypes.includes(taskType)) ||
    (userRequest &&
      DISCIPLINE_RULES.allowedExceptions.userRequests.some((term) =>
        userRequest.toLowerCase().includes(term)
      ));

  if (skip) return basePrompt;

  const rules = `

RESPONSE DISCIPLINE (MANDATORY):
- Maximum ${DISCIPLINE_RULES.maxResponseWords} words unless user explicitly requests detail
- NO preambles: ${DISCIPLINE_RULES.forbiddenPreambles.join(", ")}
- Start with direct answer or action
- Use bullet points for multi-part answers
`;

  return `${basePrompt}${rules}`;
}


