export type CouncilError = {
  code: string;
  message: string;
};

export type CouncilResult = {
  success: boolean;
  response?: string;
  sessionId: string;
  cost: number;
  duration: number;
  error?: CouncilError;
};

export type CouncilContext = Record<string, unknown> & {
  userId?: string;
  authToken?: string;
  requestId?: string;
};

export type GroqUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type GroqResult = {
  success: boolean;
  content?: string;
  model?: string;
  usage?: GroqUsage;
  error?: CouncilError;
};

export type CouncilAgentInput = {
  query: string;
  context: CouncilContext;
  prior?: string;
};

export type CouncilAgentOutput = {
  success: boolean;
  content?: string;
  usage?: GroqUsage;
  error?: CouncilError;
};
