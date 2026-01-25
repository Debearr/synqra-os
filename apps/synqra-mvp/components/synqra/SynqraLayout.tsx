import React from "react";
import { PromptEnvelope, WorkflowStage } from "../../types/synqra-workflow";
import { cn } from "@/lib/utils"; // Assuming standard utils

interface SynqraLayoutProps {
    context: PromptEnvelope;
    currentStage: WorkflowStage;
    children: React.ReactNode;
}

export function SynqraLayout({ context, currentStage, children }: SynqraLayoutProps) {
    const steps: { id: WorkflowStage; label: string }[] = [
        { id: "brief", label: "Brief" },
        { id: "options", label: "Options" },
        { id: "analysis", label: "Trade-offs" },
        { id: "handoff", label: "Handoff" },
    ];

    return (
        <div className="flex h-screen w-full bg-black text-neutral-200 font-sans selection:bg-emerald-500/30">
            {/* LEFT RAIL: Context & Navigation */}
            <aside className="w-80 border-r border-neutral-900 bg-neutral-950 flex flex-col shrink-0">
                {/* Header */}
                <div className="p-8 border-b border-neutral-900/50">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-500 font-mono mb-3">
                        Synqra OS // Creative
                    </div>
                    <h1 className="text-xl font-light text-white leading-tight tracking-tight">
                        {context.task}
                    </h1>
                </div>

                {/* Workflow Progress */}
                <div className="py-8 px-8 border-b border-neutral-900/50">
                    <div className="space-y-2">
                        {steps.map((step, idx) => {
                            const isActive = step.id === currentStage;
                            const isPast = steps.findIndex(s => s.id === currentStage) > idx;

                            return (
                                <div key={step.id} className="flex items-center gap-4 py-1 group cursor-default">
                                    <div className={`
                                        w-1.5 h-1.5 rounded-full transition-all duration-300
                                        ${isActive ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] scale-125" :
                                            isPast ? "bg-neutral-700" : "bg-neutral-800"}
                                    `} />
                                    <span className={`
                                        text-[11px] uppercase tracking-widest font-mono transition-colors duration-300
                                        ${isActive ? "text-white" : isPast ? "text-neutral-500" : "text-neutral-700"}
                                    `}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Context Details */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div>
                        <div className="text-[10px] uppercase text-neutral-600 mb-4 tracking-widest">Key Context</div>
                        {Object.entries(context.context).map(([k, v]) => (
                            <div key={k} className="mb-5 last:mb-0">
                                <div className="text-[11px] text-neutral-500 capitalize mb-1">{k.replace(/_/g, " ")}</div>
                                <div className="text-xs text-neutral-300 font-mono border-l border-neutral-800 pl-3 py-0.5 leading-relaxed">
                                    {String(v)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-900/50 text-[10px] text-neutral-700 font-mono text-center uppercase tracking-wider">
                    ReadOnly Mode • Human-in-Command
                </div>
            </aside>

            {/* MAIN STAGE */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </main>
        </div>
    );
}
