import { getDeepSeekConfig, getKieAiKey } from "../config";
import type { LeadPayload, NurturePlan, QualificationResult } from "../types";
import { logSalesEvent, recordAiSession } from "../db/client";

type AiModel = "kie.ai" | "gpt-5" | "deepseek-router";

function buildAiPrompt(lead: LeadPayload, goal: "qualify" | "nurture" | "close") {
  return [
    `Goal: ${goal}`,
    `Lead Name: ${lead.fullName ?? "Unknown"}`,
    `Email: ${lead.email ?? "Unknown"}`,
    lead.company ? `Company: ${lead.company}` : undefined,
    lead.context ? `Context: ${lead.context}` : undefined,
    `Telegram: ${lead.telegramHandle ?? "N/A"}`,
    `Source: ${lead.source ?? "unknown"}`,
    "Respond with structured JSON including rationale, risk, and recommended next step.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callDeepSeek(prompt: string) {
  const config = getDeepSeekConfig();
  if (!config.url || !config.token) {
    return undefined;
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        prompt,
        mode: "sales_qualification",
      }),
    });

    if (!response.ok) {
      console.warn("[sales-engine] DeepSeek Router request failed", await response.text());
      return undefined;
    }

    return response.json();
  } catch (error) {
    console.warn("[sales-engine] DeepSeek Router error", error);
    return undefined;
  }
}

async function callKieAI(prompt: string) {
  const key = getKieAiKey();
  if (!key) {
    return undefined;
  }

  try {
    const response = await fetch("https://api.kie.ai/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify({
        prompt,
        mode: "structured",
      }),
    });

    if (!response.ok) {
      console.warn("[sales-engine] Kie.AI request failed", await response.text());
      return undefined;
    }

    return response.json();
  } catch (error) {
    console.warn("[sales-engine] Kie.AI error", error);
    return undefined;
  }
}

function interpretQualification(raw: any): QualificationResult | undefined {
  if (!raw) return undefined;

  const payload = raw.result ?? raw.data ?? raw;
  const score = Number(payload.score ?? payload.confidence ?? 0);

  if (Number.isNaN(score)) {
    return undefined;
  }

  let tier: QualificationResult["tier"] = "cold";
  if (score >= 80) tier = "hot";
  else if (score >= 50) tier = "warm";

  return {
    score: Math.max(0, Math.min(100, score)),
    tier,
    rationale: payload.rationale ?? payload.explanation ?? "No rationale supplied",
    recommendedNextStep: payload.next_step ?? payload.recommendation ?? "Follow up manually",
    aiModel: payload.model ?? "unknown",
    aiSessionId: payload.session_id ?? payload.id,
  };
}

function interpretNurture(raw: any): NurturePlan | undefined {
  if (!raw) return undefined;
  const payload = raw.plan ?? raw.result ?? raw;

  const cadence = (payload.cadence ?? "daily") as NurturePlan["cadence"];
  const channels = (payload.channels ??
    ["telegram", "n8n"]) as NurturePlan["channels"];

  return {
    cadence,
    channels,
    narrative: payload.narrative ?? payload.story ?? "",
    assets: payload.assets ?? [],
  };
}

async function logAiInteraction(params: {
  leadId?: string;
  model: AiModel;
  prompt: string;
  response: string;
}) {
  await recordAiSession({
    leadId: params.leadId,
    model: params.model,
    prompt: params.prompt,
    response: params.response,
  });
}

export async function qualifyLeadWithAi(lead: LeadPayload & { id?: string }) {
  const prompt = buildAiPrompt(lead, "qualify");
  const [deepSeek, kieAi] = await Promise.all([
    callDeepSeek(prompt),
    callKieAI(prompt),
  ]);

  const result = interpretQualification(kieAi) ?? interpretQualification(deepSeek);

  if (result) {
    await logAiInteraction({
      leadId: lead.id,
      model: (result.aiModel?.includes("deepseek") ? "deepseek-router" : "kie.ai") as AiModel,
      prompt,
      response: JSON.stringify(result),
    });
    await logSalesEvent({
      leadId: lead.id,
      type: "lead_scored",
      payload: result,
    });
  }

  return result;
}

export async function buildNurturePlan(lead: LeadPayload & { id?: string }) {
  const prompt = buildAiPrompt(lead, "nurture");
  const [deepSeek, kieAi] = await Promise.all([
    callDeepSeek(prompt),
    callKieAI(prompt),
  ]);

  const plan = interpretNurture(kieAi) ?? interpretNurture(deepSeek);

  if (plan) {
    await logAiInteraction({
      leadId: lead.id,
      model: "gpt-5", // fallback label for blended reasoning
      prompt,
      response: JSON.stringify(plan),
    });
  }

  return plan;
}
