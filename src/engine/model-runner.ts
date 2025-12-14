interface RunModelParams {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  responseFormat: "json" | "text";
}

interface RunModelResult {
  output: unknown;
  usedTokens: number;
  latencyMs: number;
}

const summarize = (input: string, limit: number): string => {
  if (input.length <= limit) return input;
  return `${input.slice(0, limit)}…`;
};

const generateTraceId = () => crypto.randomUUID();

export const emulateModelRun = async ({
  model,
  system,
  user,
  maxTokens,
  responseFormat,
}: RunModelParams): Promise<RunModelResult> => {
  const start = performance.now();
  const condensed = summarize(user, 360);
  const guidance = system.split(". ").at(0) ?? system;
  const usedTokens = Math.min(maxTokens, Math.ceil(user.length / 4) + 64);

  const payload =
    responseFormat === "json"
      ? {
          content: condensed,
          summary: guidance,
          actions: ["Clarify goal", "Ship draft", "Review risks"],
          confidence: 0.74,
          traceId: generateTraceId(),
          model,
        }
      : `${guidance}\n\n${condensed}`;

  const latencyMs = Math.max(18, Math.round(performance.now() - start));

  return { output: payload, usedTokens, latencyMs };
};
