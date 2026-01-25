import type { AIRequest, AIResponse, TaskType } from "./client";
import {
  logCouncilQuery,
  logCouncilResponse,
  logCouncilDecision,
} from "../db/supabase";

export interface CouncilMember {
  name: string;
  role?: string;
  taskType?: TaskType;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CouncilRequest extends Omit<AIRequest, "prompt"> {
  app: "synqra" | "noid" | "aurafx" | "shared";
  prompt: string;
  requester?: string;
  members?: CouncilMember[];
  synthesize?: boolean;
  log?: boolean;
}

export interface CouncilMemberResult {
  member: CouncilMember;
  response: AIResponse;
  responseId?: string;
}

export interface CouncilDecision {
  selectionMethod: "synthesis" | "first" | "error";
  summary?: string;
  selectedResponseId?: string | null;
}

export interface CouncilError {
  code: "groq_unavailable" | "groq_failed";
  message: string;
  status: number;
}

export interface CouncilResult {
  queryId?: string;
  members: CouncilMemberResult[];
  final: AIResponse;
  decision: CouncilDecision;
  error?: CouncilError;
}

const DEFAULT_COUNCIL: CouncilMember[] = [
  { name: "Strategist", role: "Strategic framing", taskType: "strategic" },
  { name: "Architect", role: "Structured solution", taskType: "structural" },
  { name: "Refiner", role: "Clarity and polish", taskType: "refine" },
];

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const DEFAULT_MAX_TOKENS = 512;

function buildSystemPrompt(basePrompt?: string, memberPrompt?: string): string | undefined {
  if (!basePrompt && !memberPrompt) return undefined;
  if (basePrompt && memberPrompt) {
    return `${basePrompt}\n\nCouncil role context:\n${memberPrompt}`;
  }
  return basePrompt || memberPrompt;
}

function buildMemberPrompt(prompt: string, member: CouncilMember): string {
  const roleLine = member.role ? `Role: ${member.role}.` : "";
  return `${prompt}\n\n${roleLine} Provide a concise, production-ready response followed by 2-4 bullet rationale points.`.trim();
}

function buildSynthesisPrompt(prompt: string, members: CouncilMemberResult[]): string {
  const compiled = members
    .map(
      (entry, index) =>
        `Member ${index + 1}: ${entry.member.name}\nResponse:\n${entry.response.content}`
    )
    .join("\n\n");

  return [
    "You are the council synthesizer.",
    "Review the member responses and produce a single, production-safe answer.",
    "Keep it concise, actionable, and aligned with existing system patterns.",
    "Provide the final response first, then a short rationale summary.",
    "",
    "Original prompt:",
    prompt,
    "",
    "Council responses:",
    compiled,
  ].join("\n");
}

type GroqChatMessage = { role: "system" | "user"; content: string };

type GroqResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
};

async function generateWithGroq({
  prompt,
  systemPrompt,
  temperature,
  maxTokens,
}: {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      content: "",
      model: DEFAULT_GROQ_MODEL,
      tier: "cheap",
      usage: { inputTokens: 0, outputTokens: 0 },
      metadata: {
        error: "GROQ_API_KEY not configured",
      },
    };
  }

  const messages: GroqChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens ?? DEFAULT_MAX_TOKENS, DEFAULT_MAX_TOKENS),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      content: "",
      model: DEFAULT_GROQ_MODEL,
      tier: "cheap",
      usage: { inputTokens: 0, outputTokens: 0 },
      metadata: {
        error: `Groq request failed: ${response.status}`,
        details: text,
      },
    };
  }

  const data = (await response.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;

  return {
    content,
    model: data.model || DEFAULT_GROQ_MODEL,
    tier: "cheap",
    usage: {
      inputTokens,
      outputTokens,
    },
  };
}

function buildErrorResult(message: string, code: CouncilError["code"], status: number): CouncilResult {
  return {
    queryId: undefined,
    members: [],
    final: {
      content: "",
      model: DEFAULT_GROQ_MODEL,
      tier: "cheap",
      usage: { inputTokens: 0, outputTokens: 0 },
      metadata: { error: message },
    },
    decision: {
      selectionMethod: "error",
      summary: "Council query failed.",
      selectedResponseId: null,
    },
    error: {
      code,
      message,
      status,
    },
  };
}

export async function queryCouncil(request: CouncilRequest): Promise<CouncilResult> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return buildErrorResult("Groq is not configured for queryCouncil.", "groq_unavailable", 500);
  }

  const members = request.members?.length ? request.members : DEFAULT_COUNCIL;
  const shouldLog = request.log ?? true;

  const queryId = shouldLog
    ? await logCouncilQuery({
        app: request.app,
        prompt: request.prompt,
        system_prompt: request.systemPrompt,
        requester: request.requester,
        metadata: request.metadata,
      })
    : undefined;

  const results: CouncilMemberResult[] = [];

  for (const member of members) {
    const response = await generateWithGroq({
      prompt: buildMemberPrompt(request.prompt, member),
      systemPrompt: buildSystemPrompt(request.systemPrompt, member.systemPrompt),
      temperature: member.temperature ?? request.temperature,
      maxTokens: member.maxTokens ?? request.maxTokens,
    });

    if (!response.content) {
      return buildErrorResult(
        "Groq request failed while generating council response.",
        "groq_failed",
        502
      );
    }

    const responseId = shouldLog && queryId
      ? await logCouncilResponse({
        query_id: queryId,
        member_name: member.name,
        member_role: member.role,
        task_type: member.taskType || request.taskType,
        model_used: response.model,
        model_tier: response.tier,
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
        response: response.content,
        metadata: response.metadata,
      })
      : undefined;

    results.push({
      member,
      response,
      responseId,
    });
  }

  const synthesize = request.synthesize ?? true;
  let finalResponse: AIResponse;
  let decision: CouncilDecision;

  if (synthesize) {
    finalResponse = await generateWithGroq({
      prompt: buildSynthesisPrompt(request.prompt, results),
      systemPrompt: request.systemPrompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    if (!finalResponse.content) {
      return buildErrorResult(
        "Groq request failed while synthesizing council response.",
        "groq_failed",
        502
      );
    }

    decision = {
      selectionMethod: "synthesis",
      summary: "Synthesis generated from council responses.",
      selectedResponseId: null,
    };
  } else {
    finalResponse = results[0]?.response || (await generateWithGroq({
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
    }));

    decision = {
      selectionMethod: "first",
      summary: "First council response selected (no synthesis).",
      selectedResponseId: results[0]?.responseId || null,
    };
  }

  if (shouldLog && queryId) {
    await logCouncilDecision({
      query_id: queryId,
      selection_method: decision.selectionMethod,
      selected_response_id: decision.selectedResponseId || null,
      summary: decision.summary,
      metadata: request.metadata,
    });
  }

  return {
    queryId,
    members: results,
    final: finalResponse,
    decision,
  };
}
