"use server";

import { revalidatePath } from "next/cache";

import { parseOpsSchema, requireOpsAdmin } from "./_server";

export async function approveDraftAction(formData: FormData): Promise<void> {
  const schema = parseOpsSchema(String(formData.get("schema") ?? ""));
  const draftId = String(formData.get("draft_id") ?? "").trim();
  if (!schema || !draftId) {
    return;
  }

  const { supabase, userId } = await requireOpsAdmin();
  await supabase
    .schema(schema)
    .from("email_drafts")
    .update({
      send_flag: true,
      approval_status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("send_flag", false);

  revalidatePath("/ops");
}

export async function skipDraftAction(formData: FormData): Promise<void> {
  const schema = parseOpsSchema(String(formData.get("schema") ?? ""));
  const draftId = String(formData.get("draft_id") ?? "").trim();
  if (!schema || !draftId) {
    return;
  }

  const { supabase } = await requireOpsAdmin();
  await supabase
    .schema(schema)
    .from("email_drafts")
    .update({
      approval_status: "rejected",
      send_flag: false,
    })
    .eq("id", draftId)
    .eq("send_flag", false);

  revalidatePath("/ops");
}

export async function setGlobalKillAction(formData: FormData): Promise<void> {
  const nextStatus = String(formData.get("next_status") ?? "").trim() === "active" ? "active" : "paused";
  const { supabase } = await requireOpsAdmin();

  for (const schema of ["ops_realtors", "ops_travel"] as const) {
    await supabase
      .schema(schema)
      .from("campaigns")
      .update({ status: nextStatus })
      .neq("status", nextStatus);
  }

  revalidatePath("/ops");
}

export async function setVerticalCampaignStatusAction(formData: FormData): Promise<void> {
  const schema = parseOpsSchema(String(formData.get("schema") ?? ""));
  const nextStatus = String(formData.get("next_status") ?? "").trim() === "active" ? "active" : "paused";
  if (!schema) {
    return;
  }

  const { supabase } = await requireOpsAdmin();
  await supabase
    .schema(schema)
    .from("campaigns")
    .update({ status: nextStatus })
    .neq("status", nextStatus);

  revalidatePath("/ops");
}

