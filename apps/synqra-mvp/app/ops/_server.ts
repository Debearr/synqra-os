import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { loadRecentSentryIssues as loadRecentSentryIssuesFromApi, type RecentSentryIssue } from "@/lib/ops/sentry";
import { createClient } from "@/utils/supabase/server";

export const OPS_SCHEMAS = ["ops_realtors", "ops_travel"] as const;
export type OpsSchema = (typeof OPS_SCHEMAS)[number];

type ProfileAdminRow = {
  is_admin: boolean | null;
};

type EmailDraftRow = {
  id: string;
  to_email: string | null;
  subject: string | null;
  approval_status: string | null;
  send_flag: boolean | null;
  created_at: string | null;
};

type CampaignRow = {
  id: string;
  name: string | null;
  status: string | null;
  updated_at: string | null;
};

export type OpsDraft = {
  id: string;
  vertical: "Realtors" | "Travel";
  schema: OpsSchema;
  toEmail: string;
  subject: string;
  approvalStatus: string;
  sendFlag: boolean;
  createdAt: string | null;
};

export type PipelineSummary = {
  totalLeads: number;
  pendingEnrichment: number;
  failedEnrichment: number;
  pendingDrafts: number;
};

export type PipelineNumbers = {
  totals: PipelineSummary;
  byVertical: Array<{
    schema: OpsSchema;
    label: "Realtors" | "Travel";
    summary: PipelineSummary;
  }>;
};

export type CampaignControlItem = {
  schema: OpsSchema;
  label: "Realtors" | "Travel";
  campaignId: string | null;
  campaignName: string;
  status: "active" | "paused" | "unknown";
  updatedAt: string | null;
};

export type CampaignControlState = {
  globalKillActive: boolean;
  items: CampaignControlItem[];
};

export type OpsErrorsState = {
  configured: boolean;
  reason: string | null;
  issues: RecentSentryIssue[];
};

export async function requireOpsAdmin(): Promise<{ supabase: SupabaseClient; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/auth/sign-in?next=%2Fops");
  }

  const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle<ProfileAdminRow>();
  if (error || !data?.is_admin) {
    redirect("/user");
  }

  return { supabase, userId: user.id };
}

export async function loadTodaysDrafts(supabase: SupabaseClient): Promise<OpsDraft[]> {
  const dayStartIso = startOfUtcDayIso();

  const results = await Promise.all(
    OPS_SCHEMAS.map(async (schema) => {
      const { data, error } = await supabase
        .schema(schema)
        .from("email_drafts")
        .select("id,to_email,subject,approval_status,send_flag,created_at")
        .gte("created_at", dayStartIso)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error || !Array.isArray(data)) {
        console.error("[ops] failed to load drafts", { schema, error: error?.message });
        return [] as OpsDraft[];
      }

      return data.map((row) => mapDraft(schema, row as EmailDraftRow));
    })
  );

  return results
    .flat()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function loadPipelineNumbers(supabase: SupabaseClient): Promise<PipelineNumbers> {
  const byVertical = await Promise.all(
    OPS_SCHEMAS.map(async (schema) => {
      const [totalLeads, pendingEnrichment, failedEnrichment, pendingDrafts] = await Promise.all([
        readCount(
          supabase
            .schema(schema)
            .from("leads")
            .select("id", { count: "exact", head: true })
        ),
        readCount(
          supabase
            .schema(schema)
            .from("enrichment")
            .select("id", { count: "exact", head: true })
            .eq("enrichment_status", "pending")
        ),
        readCount(
          supabase
            .schema(schema)
            .from("enrichment")
            .select("id", { count: "exact", head: true })
            .in("enrichment_status", ["failed", "invalid_output"])
        ),
        readCount(
          supabase
            .schema(schema)
            .from("email_drafts")
            .select("id", { count: "exact", head: true })
            .eq("approval_status", "pending")
            .eq("send_flag", false)
        ),
      ]);

      return {
        schema,
        label: schema === "ops_realtors" ? "Realtors" : "Travel",
        summary: {
          totalLeads,
          pendingEnrichment,
          failedEnrichment,
          pendingDrafts,
        },
      } as const;
    })
  );

  return {
    totals: {
      totalLeads: byVertical.reduce((acc, item) => acc + item.summary.totalLeads, 0),
      pendingEnrichment: byVertical.reduce((acc, item) => acc + item.summary.pendingEnrichment, 0),
      failedEnrichment: byVertical.reduce((acc, item) => acc + item.summary.failedEnrichment, 0),
      pendingDrafts: byVertical.reduce((acc, item) => acc + item.summary.pendingDrafts, 0),
    },
    byVertical,
  };
}

export async function loadCampaignControls(supabase: SupabaseClient): Promise<CampaignControlState> {
  const items = await Promise.all(
    OPS_SCHEMAS.map(async (schema) => {
      const { data, error } = await supabase
        .schema(schema)
        .from("campaigns")
        .select("id,name,status,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<CampaignRow>();

      if (error) {
        console.error("[ops] failed to load campaign state", { schema, error: error.message });
        return {
          schema,
          label: schema === "ops_realtors" ? "Realtors" : "Travel",
          campaignId: null,
          campaignName: "Unavailable",
          status: "unknown",
          updatedAt: null,
        } as CampaignControlItem;
      }

      const normalizedStatus =
        data?.status === "paused" ? "paused" : data?.status === "active" ? "active" : "unknown";

      return {
        schema,
        label: schema === "ops_realtors" ? "Realtors" : "Travel",
        campaignId: data?.id ?? null,
        campaignName: data?.name?.trim() || "Default campaign",
        status: normalizedStatus,
        updatedAt: data?.updated_at ?? null,
      } as CampaignControlItem;
    })
  );

  return {
    globalKillActive: items.every((item) => item.status === "paused"),
    items,
  };
}

export function parseOpsSchema(input: string): OpsSchema | null {
  return OPS_SCHEMAS.includes(input as OpsSchema) ? (input as OpsSchema) : null;
}

export async function loadRecentSentryIssues(limit = 5): Promise<OpsErrorsState> {
  const result = await loadRecentSentryIssuesFromApi(limit);
  if (!result.configured) {
    return { configured: false, reason: result.reason, issues: [] };
  }
  return { configured: true, reason: null, issues: result.issues };
}

function mapDraft(schema: OpsSchema, row: EmailDraftRow): OpsDraft {
  return {
    id: row.id,
    vertical: schema === "ops_realtors" ? "Realtors" : "Travel",
    schema,
    toEmail: row.to_email?.trim() || "unknown",
    subject: row.subject?.trim() || "Untitled draft",
    approvalStatus: row.approval_status?.trim() || "pending",
    sendFlag: Boolean(row.send_flag),
    createdAt: row.created_at,
  };
}

async function readCount(query: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return typeof count === "number" ? count : 0;
}

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}
