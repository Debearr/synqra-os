import React from "react";
import { OptionSet, CreativeOption } from "../../types/synqra-workflow";
import { CheckCircle2, FileJson, ArrowRight, Lock } from "lucide-react";

interface HandoffSummaryProps {
    selectedOption: CreativeOption;
}

export function HandoffSummary({ selectedOption }: HandoffSummaryProps) {
    return (
        <section className="flex-1 overflow-y-auto bg-black">
            <div className="max-w-4xl mx-auto px-8 py-16 w-full h-full flex flex-col justify-center">

                {/* Header Block */}
                <div className="text-center space-y-6 mb-8">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready for Production
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-5xl font-light text-white tracking-tight">Decision Locked</h2>
                        <p className="text-neutral-400 text-lg font-light">
                            The following concept has been selected and validated for execution.
                        </p>
                    </div>
                </div>

                {/* Card Block */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-10 space-y-8 relative overflow-hidden backdrop-blur-md mb-8">
                    <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] pointer-events-none">
                        <Lock className="w-48 h-48 text-white rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest block mb-2">Selected Concept</span>
                        <h3 className="text-3xl font-light text-white">{selectedOption.label}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-8 border-t border-neutral-800/50 relative z-10">
                        <div>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-3">Primary Asset</span>
                            <div className="text-base text-neutral-200 font-light">
                                Strategic Brief v1.0
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-3">Theme</span>
                            <div className="text-base text-neutral-200 font-light">
                                {selectedOption.value.theme}
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-xl p-6 font-mono text-[11px] text-neutral-400 border border-neutral-800/80 overflow-x-auto relative z-10">
                        {`// Handoff Payload
{
  "id": "${selectedOption.id}",
  "status": "APPROVED",
  "next_step": "HUMAN_EXECUTION",
  "automated": false,
  "timestamp": "${new Date().toISOString()}"
}`}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-center">
                    <button className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                        <FileJson className="w-4 h-4" />
                        Export Specification
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </section>
    );
}
