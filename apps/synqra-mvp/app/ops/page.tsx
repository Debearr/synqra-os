import {
  approveDraftAction,
  setGlobalKillAction,
  setVerticalCampaignStatusAction,
  skipDraftAction,
} from "./actions";
import { loadCampaignControls, loadPipelineNumbers, loadRecentSentryIssues, loadTodaysDrafts, requireOpsAdmin } from "./_server";
import { captureOpsError } from '@/lib/ops/sentry';
import { generateUnsubscribeToken, validateUnsubscribeToken } from '@/lib/ops/unsubscribe-token';

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const { supabase } = await requireOpsAdmin();
  const [drafts, pipeline, campaigns, errors] = await Promise.all([
    loadTodaysDrafts(supabase),
    loadPipelineNumbers(supabase),
    loadCampaignControls(supabase),
    loadRecentSentryIssues(5),
  ]);

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
        <header className="rounded-3xl border border-black/10 bg-white px-5 py-5">
          <p className="text-xs font-medium tracking-[0.16em] uppercase text-black/55">Synqra Ops</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Founder Controls</h1>
          <p className="mt-1 text-sm text-black/60">Server-gated admin route. Data loads through RLS-backed ops schemas.</p>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white px-5 py-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Today&apos;s Drafts</h2>
            <p className="text-sm text-black/55">Approve or skip from a single queue.</p>
          </div>

          {drafts.length === 0 ? (
            <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 text-sm text-black/60">No drafts found for today.</p>
          ) : (
            <ul className="space-y-3">
              {drafts.map((draft) => (
                <li key={`${draft.schema}-${draft.id}`} className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-black/50">{draft.vertical}</p>
                  <p className="mt-1 text-sm font-medium">{draft.subject}</p>
                  <p className="mt-1 text-sm text-black/60">{draft.toEmail}</p>
                  <p className="mt-1 text-xs text-black/50">Status: {draft.approvalStatus}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <form action={approveDraftAction}>
                      <input type="hidden" name="schema" value={draft.schema} />
                      <input type="hidden" name="draft_id" value={draft.id} />
                      <button
                        type="submit"
                        className="min-h-12 w-full rounded-xl bg-[#1d1d1f] px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                        disabled={draft.sendFlag}
                      >
                        Approve
                      </button>
                    </form>
                    <form action={skipDraftAction}>
                      <input type="hidden" name="schema" value={draft.schema} />
                      <input type="hidden" name="draft_id" value={draft.id} />
                      <button
                        type="submit"
                        className="min-h-12 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-medium text-[#1d1d1f] disabled:opacity-40"
                        disabled={draft.sendFlag}
                      >
                        Skip
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-black/10 bg-white px-5 py-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Pipeline Numbers</h2>
            <p className="text-sm text-black/55">A quick operational snapshot.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricTile label="Total Leads" value={pipeline.totals.totalLeads} />
            <MetricTile label="Pending Enrichment" value={pipeline.totals.pendingEnrichment} />
            <MetricTile label="Failed Enrichment" value={pipeline.totals.failedEnrichment} />
            <MetricTile label="Pending Drafts" value={pipeline.totals.pendingDrafts} />
          </div>

          <ul className="mt-3 space-y-2">
            {pipeline.byVertical.map((item) => (
              <li key={item.schema} className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm text-black/70">
                <p className="font-medium text-[#1d1d1f]">{item.label}</p>
                <p className="mt-1">Leads: {item.summary.totalLeads}</p>
                <p>Pending enrichment: {item.summary.pendingEnrichment}</p>
                <p>Pending drafts: {item.summary.pendingDrafts}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white px-5 py-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Campaign Controls</h2>
            <p className="text-sm text-black/55">Global kill switch and per-vertical pause.</p>
          </div>

          <form action={setGlobalKillAction} className="mb-3">
            <input type="hidden" name="next_status" value={campaigns.globalKillActive ? "active" : "paused"} />
            <button
              type="submit"
              className="min-h-12 w-full rounded-2xl bg-[#1d1d1f] px-4 py-3 text-sm font-semibold text-white"
            >
              {campaigns.globalKillActive ? "Resume All Campaigns" : "Global Kill: Pause All Campaigns"}
            </button>
          </form>

          <ul className="space-y-2">
            {campaigns.items.map((item) => (
              <li key={item.schema} className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4">
                <p className="text-sm font-medium text-[#1d1d1f]">{item.label}</p>
                <p className="mt-1 text-xs text-black/55">{item.campaignName}</p>
                <p className="mt-1 text-xs text-black/55">Status: {item.status}</p>
                <form action={setVerticalCampaignStatusAction} className="mt-2">
                  <input type="hidden" name="schema" value={item.schema} />
                  <input type="hidden" name="next_status" value={item.status === "paused" ? "active" : "paused"} />
                  <button
                    type="submit"
                    className="min-h-12 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-medium text-[#1d1d1f]"
                  >
                    {item.status === "paused" ? "Resume Vertical" : "Pause Vertical"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white px-5 py-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent Errors</h2>
            <p className="text-sm text-black/55">Last 5 Sentry issues.</p>
          </div>

          {!errors.configured ? (
            <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 text-sm text-black/60">
              {errors.reason ?? "Sentry not configured"}
            </p>
          ) : errors.issues.length === 0 ? (
            <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 text-sm text-black/60">No recent issues.</p>
          ) : (
            <ul className="space-y-2">
              {errors.issues.map((issue) => (
                <li key={issue.id} className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3">
                  <p className="text-sm font-medium text-[#1d1d1f]">{issue.title}</p>
                  <p className="mt-1 text-xs text-black/55">{issue.culprit}</p>
                  <p className="mt-1 text-xs text-black/55">Last seen: {issue.timestamp || "unknown"}</p>
                  <p className="mt-1 text-xs text-black/55">Status: {issue.status}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.12em] text-black/50">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
    </div>
  );
}
