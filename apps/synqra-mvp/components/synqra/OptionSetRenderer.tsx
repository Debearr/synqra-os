import React from "react";
import { OptionSet, CreativeOption } from "../../types/synqra-workflow";

interface OptionSetRendererProps {
    options: OptionSet;
    selectedId?: string;
    onSelect: (id: string) => void;
}

export function OptionSetRenderer({ options, selectedId, onSelect }: OptionSetRendererProps) {
    return (
        <section className="flex-1 overflow-y-auto bg-[url('/grid-pattern.svg')] bg-[size:24px_24px] bg-fixed">
            <div className="max-w-7xl mx-auto px-8 py-16 w-full">

                {/* Header Block */}
                <div className="flex items-end justify-between mb-8">
                    <div className="space-y-3">
                        <div className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.2em] border border-emerald-900/20 bg-emerald-950/10 px-3 py-1 inline-block rounded-full">
                            Generation Stage
                        </div>
                        <h2 className="text-4xl font-light text-white tracking-tight">{options.title}</h2>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest border border-neutral-800 rounded px-3 py-1.5 bg-neutral-950">
                        {options.options.length} Concepts Generated
                    </div>
                </div>

                {/* Grid Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {options.options.map(opt => (
                        <OptionCard
                            key={opt.id}
                            option={opt}
                            isSelected={selectedId === opt.id}
                            onSelect={() => onSelect(opt.id)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function OptionCard({ option, isSelected, onSelect }: {
    option: CreativeOption;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <div
            onClick={onSelect}
            className={`
                group cursor-pointer rounded-2xl border p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden
                ${isSelected
                    ? "bg-neutral-900 border-emerald-500/50 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.1)]"
                    : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/80 hover:border-neutral-700"}
            `}
        >
            {/* Selection Glow */}
            {isSelected && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}

            <div className="flex justify-between items-start relative z-10">
                <div className={`
                    text-[10px] font-mono px-2 py-1 rounded border uppercase tracking-widest
                    ${isSelected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-neutral-950/50 border-neutral-800 text-neutral-500"}
                `}>
                    {option.value.theme}
                </div>
                {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" />
                )}
            </div>

            <div className="space-y-3 relative z-10">
                <h3 className={`text-xl font-medium leading-snug tracking-tight ${isSelected ? "text-white" : "text-neutral-200"}`}>
                    {option.label}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                    {option.description}
                </p>
            </div>

            <div className="mt-auto pt-6 border-t border-neutral-800/50 space-y-4 relative z-10">
                <div className="space-y-1.5">
                    <span className="text-[10px] uppercase text-neutral-600 tracking-wider">Rationale</span>
                    <p className="text-xs text-neutral-500 italic leading-relaxed">"{option.value.rationale}"</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {option.tags.map(tag => (
                        <span key={tag} className="text-[10px] text-neutral-500 bg-neutral-950/50 px-2 py-1 rounded border border-neutral-800/50">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
