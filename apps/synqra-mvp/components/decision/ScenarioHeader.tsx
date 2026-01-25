import React from "react";
import { PromptEnvelope } from "../../types/decision-support";

interface ScenarioHeaderProps {
    prompt: PromptEnvelope;
    status?: "pending" | "decided";
}

export function ScenarioHeader({ prompt, status = "pending" }: ScenarioHeaderProps) {
    return (
        <div className="flex items-start justify-between border-b border-neutral-800 pb-8 mb-16">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-mono uppercase tracking-wider border border-emerald-500/20">
                        Decision Required
                    </span>
                    {status === "decided" && (
                        <span className="px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-500 text-sm font-mono uppercase tracking-wider border border-neutral-500/20">
                            Completed
                        </span>
                    )}
                </div>
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight mb-2">
                        Creative Direction
                    </h2>
                    <p className="text-neutral-400 max-w-2xl text-lg font-light">
                        Review the generated options below. Select the optimal path based on the trade-off analysis.
                    </p>
                </div>
            </div>

            <div className="text-right space-y-2">
                <div className="text-sm text-neutral-400 uppercase tracking-widest">
                    Output Format
                </div>
                <div className="text-sm font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg">
                    {prompt.output_format}
                </div>
            </div>
        </div>
    );
}
