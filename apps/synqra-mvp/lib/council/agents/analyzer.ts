import { requestGroq } from "../groq-client";
import type { CouncilAgentInput, CouncilAgentOutput } from "../types";

export async function runAnalyzer(
  input: CouncilAgentInput,
  options?: { signal?: AbortSignal }
): Promise<CouncilAgentOutput> {
  const prompt = [
    "Analyze the request and extract the core objective, constraints, and risks.",
    "Return concise bullet points with clear priorities.",
    "",
    `User query: ${input.query}`,
    input.prior ? `Prior output: ${input.prior}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await requestGroq({
    prompt,
    systemPrompt: "You are a production-safe analysis assistant.",
    signal: options?.signal,
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, content: response.content, usage: response.usage };
}
