import React from "react";
import { OptionSet } from "../../types/decision-support";
import { DecisionCard } from "./DecisionCard";

interface OptionSetRendererProps {
    optionSet: OptionSet;
    selectedOptionId?: string;
    onSelect: (id: string) => void;
}

export function OptionSetRenderer({ optionSet, selectedOptionId, onSelect }: OptionSetRendererProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-light text-white">{optionSet.title}</h3>
                    {optionSet.description && (
                        <p className="text-neutral-400 text-sm mt-2">{optionSet.description}</p>
                    )}
                </div>
                <div className="text-sm font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 uppercase tracking-wider">
                    {optionSet.options.length} Variations
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {optionSet.options.map((option) => (
                    <DecisionCard
                        key={option.id}
                        option={option}
                        selected={selectedOptionId === option.id}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}
