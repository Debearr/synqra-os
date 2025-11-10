import { logSalesEvent, recordUserMemory } from "../db/client";
import { callN8nHook } from "../integrations/n8n";
import { sendTelegramMessage } from "../integrations/telegram";

type RetentionTrigger = "usage_drop" | "churn_signal" | "upsell_ready";

export async function sendRetentionNudge(params: {
  userId: string;
  leadId?: string;
  trigger: RetentionTrigger;
  message: string;
}) {
  await logSalesEvent({
    leadId: params.leadId,
    userId: params.userId,
    type: "retention_nudge_sent",
    payload: params,
  });

  await callN8nHook("churn-prevention", {
    user_id: params.userId,
    trigger: params.trigger,
    message: params.message,
  });

  await sendTelegramMessage({
    text: `💎 Retention nudge for user ${params.userId}: ${params.message}`,
  });

  await recordUserMemory({
    userId: params.userId,
    actor: "sales-engine",
    summary: `Retention nudge triggered (${params.trigger}).`,
    tags: ["retention", params.trigger],
  });

  return { ok: true };
}

export async function logSupportTouchpoint(params: {
  userId: string;
  leadId?: string;
  summary: string;
}) {
  await logSalesEvent({
    leadId: params.leadId,
    userId: params.userId,
    type: "support_touchpoint",
    payload: params,
  });

  await recordUserMemory({
    userId: params.userId,
    actor: "support-bot",
    summary: params.summary,
    tags: ["support"],
  });

  return { ok: true };
}
