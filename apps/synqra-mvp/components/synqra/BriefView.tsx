import React from "react";
import { PromptEnvelope } from "../../types/synqra-workflow";

interface BriefViewProps {
    brief: PromptEnvelope;
}

export function BriefView({ brief }: BriefViewProps) {
    return (
        <section className="flex-1 overflow-y-auto bg-black">
            <div className="max-w-4xl mx-auto px-8 py-16 w-full">

                {/* Header Block */}
                <div className="mb-8 space-y-4">
                    <span className="inline-block text-[11px] font-mono text-emerald-500 uppercase tracking-[0.2em] border border-emerald-900/30 bg-emerald-950/10 px-3 py-1.5 rounded-full">
                        Input Stage
                    </span>
                    <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
                        Creative Directive
                    </h2>
                </div>

                {/* Content Block */}
                <div className="space-y-6">
                    <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 backdrop-blur-sm">
                        <p className="text-xl text-neutral-200 leading-relaxed font-light">
                            {brief.task}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-2xl bg-neutral-900/20 border border-neutral-800/60">
                            <h3 className="text-xs font-mono text-neutral-500 mb-6 uppercase tracking-[0.2em]">
                                Constraints
                            </h3>
                            <ul className="space-y-4">
                                {brief.context.budget && (
                                    <li className="flex flex-col gap-1">
                                        <span className="text-xs text-neutral-500 uppercase tracking-wider">Budget</span>
                                        <span className="text-neutral-200 font-medium">{brief.context.budget}</span>
                                    </li>
                                )}
                                {brief.context.deadline && (
                                    <li className="flex flex-col gap-1">
                                        <span className="text-xs text-neutral-500 uppercase tracking-wider">Timeline</span>
                                        <span className="text-neutral-200 font-medium">{brief.context.deadline}</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="p-8 rounded-2xl bg-neutral-900/20 border border-neutral-800/60">
                            <h3 className="text-xs font-mono text-neutral-500 mb-6 uppercase tracking-[0.2em]">
                                Deliverable Format
                            </h3>
                            <div className="text-sm text-emerald-400/90 font-mono bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-lg leading-relaxed">
                                {brief.output_format}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
