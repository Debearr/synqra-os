import React from "react";
import { OptionSet } from "../../types/synqra-workflow";

interface TradeOffMatrixProps {
    options: OptionSet;
    selectedId?: string;
}

export function TradeOffMatrix({ options, selectedId }: TradeOffMatrixProps) {
    if (!options.tradeoffs) return null;
    const { dimensions, data } = options.tradeoffs;

    return (
        <section className="flex-1 overflow-y-auto bg-black">
            <div className="max-w-6xl mx-auto px-8 py-16 w-full">

                {/* Header Block */}
                <div className="mb-8 space-y-6">
                    <div className="space-y-3">
                        <div className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.2em] inline-block">
                            Analysis Stage
                        </div>
                        <h2 className="text-4xl font-light text-white tracking-tight">Impact Analysis</h2>
                    </div>
                    <p className="text-neutral-400 max-w-2xl text-lg font-light leading-relaxed">
                        Comparative evaluation of generated concepts across key strategic dimensions.
                    </p>
                </div>

                {/* Table Block */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/20 overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-950/80 border-b border-neutral-800">
                                <th className="p-8 font-mono text-neutral-500 text-[10px] uppercase tracking-[0.2em] w-1/4">
                                    Dimension
                                </th>
                                {options.options.map(opt => (
                                    <th key={opt.id} className={`
                                    p-8 font-medium text-xs uppercase tracking-wider transition-colors
                                    ${opt.id === selectedId ? "text-emerald-400 bg-emerald-950/20" : "text-neutral-300"}
                                `}>
                                        {opt.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {dimensions.map((dim, idx) => (
                                <tr key={dim} className="group hover:bg-neutral-900/40 transition-colors">
                                    <td className="p-8 text-sm text-neutral-400 capitalize font-medium group-hover:text-neutral-200 transition-colors">
                                        {dim}
                                    </td>
                                    {options.options.map(opt => {
                                        const score = data[opt.id]?.[idx] || 0;
                                        const isPos = score > 0;

                                        return (
                                            <td key={opt.id} className={`p-8 ${opt.id === selectedId ? "bg-emerald-950/5" : ""}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isPos ? "bg-white" : "bg-neutral-600"}`}
                                                            style={{ width: `${Math.abs(score)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-neutral-500 w-8 text-right tabular-nums">
                                                        {score}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Status */}
                {selectedId && (
                    <div className="mt-8 p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-lg text-sm text-emerald-200/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        Viewing analysis for selected concept: <span className="font-medium text-emerald-100">{options.options.find(o => o.id === selectedId)?.label}</span>
                    </div>
                )}
            </div>
        </section>
    );
}
