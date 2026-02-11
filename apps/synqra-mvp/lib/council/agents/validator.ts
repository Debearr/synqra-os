import { requestGroq } from "../groq-client";
import type { CouncilAgentInput, CouncilAgentOutput } from "../types";

export async function runValidator(
  input: CouncilAgentInput,
  options?: { signal?: AbortSignal }
): Promise<CouncilAgentOutput> {
  const prompt = [
    "Validate the analysis for completeness, contradictions, and missing constraints.",
    "List any issues and confirm safe-to-proceed status.",
    "",
    `User query: ${input.query}`,
    input.prior ? `Prior output: ${input.prior}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await requestGroq({
    prompt,
    systemPrompt: "You are a production safety validator.",
    signal: options?.signal,
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, content: response.content, usage: response.usage };
}
