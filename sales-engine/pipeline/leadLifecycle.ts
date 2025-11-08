import {
  insertLead,
  logSalesEvent,
  readCacheEntry,
  recordUserMemory,
  updateLeadStatus,
  upsertLeadScore,
  writeCacheEntry,
} from "../db/client";
import type {
  ActivationPlan,
  ClosePlan,
  LeadPayload,
  NurturePlan,
  QualificationResult,
} from "../types";
import { qualifyLeadWithAi, buildNurturePlan } from "../ai/orchestrator";
import { callN8nHook } from "../integrations/n8n";
import { sendQualificationChatbotMessage, sendTelegramMessage } from "../integrations/telegram";
import { generateStripeCheckoutLink } from "../integrations/stripe";

type LeadRecord = { id: string } & LeadPayload;

function coerceLead(data: any): LeadRecord | undefined {
  if (!Array.isArray(data) || !data[0]?.id) {
    return undefined;
  }

  return data[0] as LeadRecord;
}

export async function createLead(payload: LeadPayload) {
  const result = await insertLead(payload);
  const lead = coerceLead(result.data);

  if (!lead) {
    return { ok: false, error: result.error ?? "Lead creation failed" };
  }

  await logSalesEvent({
    leadId: lead.id,
    type: "lead_created",
    payload: payload,
  });

  await sendTelegramMessage({
    text: `🚀 New lead captured: ${lead.fullName ?? "Unknown"} (${lead.email ?? "no email"})`,
  });

  await callN8nHook("qualification", {
    lead_id: lead.id,
    email: lead.email,
    source: lead.source,
  });

  return { ok: true, lead };
}

export async function qualifyLead(lead: LeadRecord) {
  const qualification = await qualifyLeadWithAi(lead);
  if (!qualification) {
    return { ok: false, error: "Qualification failed" };
  }

  await upsertLeadScore(lead.id, qualification);
  await updateLeadStatus(lead.id, "qualified");
  await callN8nHook("qualification", {
    lead_id: lead.id,
    qualification,
  });

  await sendQualificationChatbotMessage({
    leadName: lead.fullName,
    question: `I analysed your brand and found a ${qualification.score}% fit. Want the personalised plan?`,
    buttons: [
      {
        text: "Show me the plan",
        callbackData: `qualify:${lead.id}:accept`,
      },
      {
        text: "Ask a human",
        callbackData: `qualify:${lead.id}:human`,
      },
    ],
  });

  return { ok: true, qualification };
}

export async function nurtureLead(lead: LeadRecord) {
  const plan = await buildNurturePlan(lead);
  if (!plan) {
    return { ok: false, error: "Nurture plan unavailable" };
  }

  await updateLeadStatus(lead.id, "nurturing");
  await logSalesEvent({
    leadId: lead.id,
    type: "lead_nurtured",
    payload: plan,
  });

  await callN8nHook("nurturing", {
    lead_id: lead.id,
    plan,
  });

  await sendTelegramMessage({
    text: `🌱 Nurture plan ready for ${lead.fullName ?? "lead"}:\n\n${plan.narrative}`,
  });

  return { ok: true, plan };
}

export async function closeLead(lead: LeadRecord) {
  const checkoutUrl = await generateStripeCheckoutLink({
    customerEmail: lead.email,
    metadata: {
      lead_id: lead.id,
      source: lead.source ?? "unknown",
    },
  });

  const response: ClosePlan = {
    stripeCheckoutUrl: checkoutUrl,
    telegramMessage: checkoutUrl
      ? `🔒 Ready to lock in Synqra? Complete your setup here: ${checkoutUrl}`
      : "Our strategist will reach out with bespoke pricing.",
    followUpAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
  };

  await updateLeadStatus(lead.id, "won");
  await callN8nHook("closure", {
    lead_id: lead.id,
    checkout_url: checkoutUrl,
  });
  await logSalesEvent({
    leadId: lead.id,
    type: "lead_closed",
    payload: response,
  });

  if (response.telegramMessage) {
    await sendTelegramMessage({
      text: response.telegramMessage,
      buttons: checkoutUrl
        ? [
            {
              text: "Complete Checkout",
              url: checkoutUrl,
            },
          ]
        : undefined,
    });
  }

  return { ok: true, plan: response };
}

export async function activateUser(params: {
  lead: LeadRecord;
  userId: string;
}): Promise<{ ok: boolean; plan?: ActivationPlan }> {
  const plan: ActivationPlan = {
    welcomeFlowId: "synqra-onboarding-1",
    telegramCtaButtons: [
      { text: "Launch Concierge", url: "https://t.me/synqra_concierge_bot" },
      { text: "View Success Map", url: "https://synqra.com/success" },
    ],
    onboardingChecklist: [
      "Connect Instagram + Telegram",
      "Approve first campaign",
      "Review luxury tone presets",
    ],
  };

  await logSalesEvent({
    leadId: params.lead.id,
    userId: params.userId,
    type: "user_activated",
    payload: plan,
  });

  await callN8nHook("activation", {
    lead_id: params.lead.id,
    user_id: params.userId,
    plan,
  });

  await recordUserMemory({
    userId: params.userId,
    actor: "sales-engine",
    summary: "User activation sequence triggered.",
    tags: ["activation", "lifecycle"],
  });

  return { ok: true, plan };
}

export async function refreshSystemCache(key: string, compute: () => Promise<unknown>) {
  const cached = await readCacheEntry(key);
  if (cached.data?.[0]) {
    const entry = cached.data[0];
    if (new Date(entry.expiresAt) > new Date()) {
      return entry.value;
    }
  }

  const value = await compute();
  await writeCacheEntry({
    key,
    value,
    scope: "system",
    expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  });
  return value;
}
