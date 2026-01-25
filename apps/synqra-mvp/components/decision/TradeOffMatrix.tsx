import React from "react";
import { OptionSet } from "../../types/decision-support";

interface TradeOffMatrixProps {
    optionSet: OptionSet;
    selectedOptionId?: string;
}

export function TradeOffMatrix({ optionSet, selectedOptionId }: TradeOffMatrixProps) {
    if (!optionSet.tradeoffs) return null;

    const { dimensions, data } = optionSet.tradeoffs;

    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
                    Trade-off Analysis
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800/50">
                            <th className="p-4 font-normal text-neutral-500 font-mono text-xs w-48 bg-neutral-950/20">
                                Dimension
                            </th>
                            {optionSet.options.map(opt => (
                                <th
                                    key={opt.id}
                                    className={`p-4 font-normal min-w-[140px] transition-colors ${opt.id === selectedOptionId
                                        ? "text-emerald-400 bg-emerald-950/10 border-b-2 border-emerald-500/50"
                                        : "text-neutral-300"
                                        }`}
                                >
                                    {opt.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                        {dimensions.map((dim, dimIndex) => (
                            <tr key={dim} className="group hover:bg-neutral-800/20 transition-colors">
                                <td className="p-4 font-normal text-neutral-400 capitalize bg-neutral-950/20 group-hover:bg-transparent transition-colors">
                                    {dim}
                                </td>
                                {optionSet.options.map(opt => {
                                    const score = data[opt.id]?.[dimIndex] ?? 0;
                                    return (
                                        <td
                                            key={opt.id}
                                            className={`p-4 font-mono ${opt.id === selectedOptionId ? "bg-emerald-950/5" : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1.5 rounded-full flex-1 bg-neutral-800 overflow-hidden`}>
                                                    <div
                                                        className={`h-full ${score > 60 ? "bg-emerald-500" :
                                                            score > 30 ? "bg-emerald-500/60" :
                                                                score > 0 ? "bg-neutral-500" : "bg-neutral-700"
                                                            }`}
                                                        style={{ width: `${Math.max(0, score)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-neutral-500 w-6 text-right">{score}</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
