import React from "react";

type ModelBadgePanelProps = {
  history: string[];
};

const COLORS = ["bg-white/10", "bg-emerald-500/20", "bg-sky-500/20", "bg-amber-500/20"];

export function ModelBadgePanel({ history }: ModelBadgePanelProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {history.map((model, idx) => (
        <span
          key={`${model}-${idx}`}
          className={`rounded-full px-3 py-1 text-xs text-white/80 ${COLORS[idx % COLORS.length]}`}
        >
          {model}
        </span>
      ))}
    </div>
  );
}

export default ModelBadgePanel;
