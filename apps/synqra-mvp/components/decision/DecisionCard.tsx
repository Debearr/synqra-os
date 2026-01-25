import React from "react";
import { DecisionOption } from "../../types/decision-support";

interface DecisionCardProps {
    option: DecisionOption;
    selected?: boolean;
    onSelect?: (id: string) => void;
}

export function DecisionCard({ option, selected, onSelect }: DecisionCardProps) {
    return (
        <div
            onClick={() => !option.disabled && onSelect?.(option.id)}
            className={`
        group relative flex flex-col p-8 rounded-2xl border transition-all duration-300 cursor-pointer
        ${selected
                    ? "bg-neutral-900 border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.1)]"
                    : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60"
                }
        ${option.disabled ? "opacity-50 cursor-not-allowed grayscale" : ""}
      `}
        >
            {/* Selection Indicator */}
            <div className={`
        absolute top-8 right-8 w-4 h-4 rounded-full border flex items-center justify-center transition-colors
        ${selected ? "border-emerald-500 bg-emerald-500" : "border-neutral-700 group-hover:border-neutral-500"}
      `}>
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
            </div>

            <div className="mb-8">
                <h3 className={`text-xl font-light mb-2 ${selected ? "text-white" : "text-neutral-200"}`}>
                    {option.label}
                </h3>
                <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                    {option.description}
                </p>
            </div>

            <div className="mt-auto space-y-6 pt-6 border-t border-neutral-800/50">
                <div className="text-sm uppercase tracking-widest text-neutral-400 font-mono">
                    Impact Analysis
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {option.impact_analysis.map((factor) => (
                        <div key={factor.dimension} className="flex items-center justify-between text-xs bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                            <span className="capitalize text-neutral-400">{factor.dimension}</span>
                            <span className={`font-mono ${factor.score > 0 ? "text-emerald-400" :
                                factor.score < 0 ? "text-rose-400" : "text-neutral-500"
                                }`}>
                                {factor.score > 0 ? "+" : ""}{factor.score}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
