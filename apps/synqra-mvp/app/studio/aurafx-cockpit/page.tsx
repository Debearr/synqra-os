import type {
  AuraFxEngineResult,
  AuraFxSignalPayload,
} from "@/lib/aura-fx/types";

/**
 * Read-only cockpit state.
 * Hydrated later from AuraFX computed output.
 */
type CockpitState = {
  engine: AuraFxEngineResult | null;
  signal: AuraFxSignalPayload | null;
  lastEvaluatedAt: string | null;
  reasoning: string | null;
};

/**
 * Placeholder static state.
 * No fetching. No polling. No mutation.
 */
const state: CockpitState = {
  engine: null,
  signal: null,
  lastEvaluatedAt: null,
  reasoning: null,
};

const NOT_AVAILABLE = "Not available";

function display(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return NOT_AVAILABLE;
  }
  return String(value);
}

export default function AuraFxCockpitPage() {
  const engine = state.engine;
  const signal = state.signal;

  const biasHTF = engine?.trend?.direction ?? null;
  const biasLTF = null; // intentionally unresolved
  const regime = engine?.regime?.state ?? null;
  const session = engine?.session?.killzone ?? null;
  const setupState = engine?.setup?.state ?? null;

  const invalidationLevel =
    signal?.stopZone && typeof signal.stopZone !== "string"
      ? `${signal.stopZone.low.toFixed(5)} – ${signal.stopZone.high.toFixed(5)}`
      : null;

  const riskMultiple = signal?.risk?.rMultiple ?? null;
  const confidenceText = engine?.setup?.confidence ?? null;
  const confluences = engine?.confluence?.notes ?? [];
  const reasoning = state.reasoning;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="border-b border-neutral-800 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            AuraFX — Decision Cockpit
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Read-only analysis layer
          </p>
        </header>

        {/* Instrument */}
        <section className="mt-6">
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            Instrument
          </label>
          <div className="mt-2 max-w-xs">
            <select
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
              defaultValue="XAUUSD"
              disabled
            >
              <option value="XAUUSD">XAUUSD</option>
            </select>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6">
          {/* Market Context */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Market Context
            </h2>
            <div className="mt-4 grid gap-4 text-sm">
              <Row label="Bias (HTF)" value={biasHTF} />
              <Row label="Bias (LTF)" value={biasLTF} />
              <Row label="Regime" value={regime} />
              <Row label="Session / Killzone" value={session} />
              <Row label="Last Evaluation" value={state.lastEvaluatedAt} />
            </div>
          </section>

          {/* Setup Status */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Setup Status
            </h2>
            <div className="mt-4 grid gap-4 text-sm">
              <Row label="Setup State" value={setupState} />
              <Row label="Invalidation Level" value={invalidationLevel} />
              <Row label="Risk Context (R-multiple)" value={riskMultiple} />
              <Row label="Confidence" value={confidenceText} />
            </div>
          </section>

          {/* Confluence */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Confluence
            </h2>
            <div className="mt-4 text-sm">
              {confluences.length > 0 ? (
                <ul className="list-disc pl-5 text-neutral-200">
                  {confluences.map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-500">No active confluences</p>
              )}
            </div>
          </section>

          {/* Reasoning */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Reasoning
            </h2>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-neutral-300">
                View reasoning
              </summary>
              <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
                {reasoning ?? "No reasoning available"}
              </div>
            </details>
          </section>
        </div>
      </div>
    </main>
  );
}

/**
 * Stateless display row (server-safe)
 */
function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 pb-2 last:border-none">
      <span className="text-neutral-400">{label}</span>
      <span className="text-neutral-100">{display(value)}</span>
    </div>
  );
}
