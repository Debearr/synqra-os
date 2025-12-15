import React from "react";

type Trigger = {
  id: string;
  label: string;
  hit: boolean;
};

type ManualVerificationProps = {
  required: boolean;
  triggers: Trigger[];
};

export function ManualVerification({ required, triggers }: ManualVerificationProps) {
  const hits = triggers.filter((t) => t.hit);
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-amber-200">
        <span>Manual Verification</span>
        <span className="rounded bg-amber-500/20 px-2 py-1 text-[11px] uppercase tracking-wide">
          {required ? "Required" : "Optional"}
        </span>
      </div>
      <ul className="space-y-1 text-xs text-white/80">
        {triggers.map((trigger) => (
          <li key={trigger.id} className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                trigger.hit ? "bg-amber-400" : "bg-white/20"
              }`}
            />
            <span className={trigger.hit ? "text-amber-200" : "text-white/60"}>
              {trigger.label}
            </span>
          </li>
        ))}
      </ul>
      {hits.length === 0 && (
        <p className="mt-2 text-xs text-white/60">No manual review triggers fired.</p>
      )}
    </div>
  );
}

export default ManualVerification;
