import React from "react";

type StreamingConsoleProps = {
  state: string | null;
  log: string[];
  locked?: boolean;
};

const STATE_LABELS: Record<string, string> = {
  "extracting": "Extracting signals",
  "verifying": "Verifying structure",
  "safe-check": "Brand safety check",
  "manual-verification": "Manual verification gate",
  "generating": "Generating",
  "fallback": "Fallback",
  "streaming": "Streaming",
  "complete": "Complete",
};

export function StreamingConsole({ state, log, locked }: StreamingConsoleProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-white/80">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-white/60">Streaming Console</span>
        <span
          className={`rounded px-2 py-1 text-[10px] ${
            locked ? "bg-amber-500/20 text-amber-200" : "bg-white/10 text-white/80"
          }`}
        >
          {STATE_LABELS[state || ""] || "Idle"}
        </span>
      </div>
      <div className="space-y-1">
        {log.slice(-8).map((line, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-white/30">▌</span>
            <span className="truncate">{line}</span>
          </div>
        ))}
        {log.length === 0 && (
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/20">▌</span>
            Waiting for stream...
          </div>
        )}
      </div>
    </div>
  );
}

export default StreamingConsole;
