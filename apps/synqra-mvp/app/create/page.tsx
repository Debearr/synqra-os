"use client";

import { useMemo, useState } from "react";
import { useCreator } from "@/hooks/useCreator";

type Mode = "model" | "template";

const modelOptions = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-3.5-mini", label: "GPT-3.5 Mini" },
];

const templateOptions = [
  { id: "creator-shortform", label: "Shortform Creator" },
  { id: "creator-longform", label: "Longform Creator" },
];

export default function CreatePage() {
  const [mode, setMode] = useState<Mode>("model");
  const [modelId, setModelId] = useState(modelOptions[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templateOptions[0]?.id ?? "");
  const [input, setInput] = useState("");

  const { runModel, runTemplate, state } = useCreator();

  const run = async () => {
    if (!input.trim()) return;
    if (mode === "model") {
      await runModel(modelId, { prompt: input });
    } else {
      await runTemplate(templateId, { input });
    }
  };

  const loading = useMemo(
    () => state.model.loading || state.template.loading,
    [state.model.loading, state.template.loading]
  );

  const error = state.model.error || state.template.error;
  const result = state.model.result ?? state.template.result;
  const partial = state.model.partial || state.template.partial;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Creator Engine</h1>
        <p className="text-sm text-neutral-400">
          Run models or templates with structured output safety.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="col-span-2 space-y-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow">
            <div className="flex items-center gap-3 mb-3">
              <ModeToggle mode={mode} onChange={setMode} />
              <div className="flex-1">
                {mode === "model" ? (
                  <Selector
                    label="Model"
                    value={modelId}
                    onChange={setModelId}
                    options={modelOptions}
                  />
                ) : (
                  <Selector
                    label="Template"
                    value={templateId}
                    onChange={setTemplateId}
                    options={templateOptions}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={run}
                disabled={loading}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-60"
              >
                {loading ? "Running..." : "Run"}
              </button>
            </div>
            <textarea
              className="w-full min-h-[160px] rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="Enter prompt or variables JSON..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {error ? (
              <p className="mt-2 text-sm text-rose-400">Error: {error}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <StatusCard loading={loading} partial={partial} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow">
        <h2 className="text-sm font-semibold text-neutral-200 mb-2">Output</h2>
        {result ? (
          <pre className="whitespace-pre-wrap break-words rounded-xl bg-neutral-950 p-3 text-sm text-neutral-100 border border-neutral-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : partial ? (
          <pre className="whitespace-pre-wrap break-words rounded-xl bg-neutral-950 p-3 text-sm text-neutral-300 border border-neutral-800">
            {partial}
          </pre>
        ) : (
          <p className="text-sm text-neutral-500">Awaiting output…</p>
        )}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex rounded-lg border border-neutral-800 bg-neutral-950 p-1 text-xs">
      {(["model", "template"] as Mode[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-3 py-1 rounded-md ${
            mode === key ? "bg-emerald-500 text-neutral-900" : "text-neutral-300"
          }`}
        >
          {key === "model" ? "Model" : "Template"}
        </button>
      ))}
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-xs text-neutral-400">
      <span className="mb-1">{label}</span>
      <select
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusCard({ loading, partial }: { loading: boolean; partial: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow">
      <p className="text-sm font-semibold text-neutral-200 mb-1">Status</p>
      <p className="text-xs text-neutral-400 mb-2">
        {loading ? "Running…" : "Idle"}
      </p>
      {partial ? (
        <div className="text-[11px] text-neutral-300 max-h-32 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-2">
          {partial}
        </div>
      ) : (
        <p className="text-[11px] text-neutral-500">No partial output yet.</p>
      )}
    </div>
  );
}
