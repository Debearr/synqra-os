"use client";

type StatusQState = "idle" | "generating" | "complete" | "error";

type StatusQProps = {
  status: StatusQState;
  label?: string;
};

const toneByStatus: Record<StatusQState, string> = {
  idle: "border-white/25 text-white/70",
  generating: "border-amber-300/60 text-amber-200",
  complete: "border-emerald-300/60 text-emerald-200",
  error: "border-rose-300/60 text-rose-200",
};

export default function StatusQ({ status, label }: StatusQProps) {
  return (
    <div className="fixed right-6 top-6 z-50">
      <div
        className={`rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] backdrop-blur ${toneByStatus[status]}`}
      >
        {label || status}
      </div>
    </div>
  );
}
