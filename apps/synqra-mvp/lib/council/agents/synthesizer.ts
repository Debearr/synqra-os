import { requestGroq } from "../groq-client";
import type { CouncilAgentInput, CouncilAgentOutput } from "../types";

export async function runSynthesizer(
  input: CouncilAgentInput,
  options?: { signal?: AbortSignal }
): Promise<CouncilAgentOutput> {
  const prompt = [
    "Synthesize a final response that is concise, actionable, and safe for production.",
    "Provide the final response only (no analysis).",
    "",
    `User query: ${input.query}`,
    input.prior ? `Prior output: ${input.prior}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await requestGroq({
    prompt,
    systemPrompt: "You are the council synthesizer for Synqra.",
    signal: options?.signal,
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, content: response.content, usage: response.usage };
}
