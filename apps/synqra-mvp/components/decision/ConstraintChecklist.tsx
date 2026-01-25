import React from "react";
import { Constraint, DecisionOption, ConstraintStatus } from "../../types/decision-support";
// Assuming lucide-react is available in standard shadcn setup, otherwise I'd use ASCII or SVG
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface ConstraintChecklistProps {
    constraints: Constraint[];
    selectedOption?: DecisionOption;
}

export function ConstraintChecklist({ constraints, selectedOption }: ConstraintChecklistProps) {
    // Mock validation logic for display - in real app this would likely come from info on the option itself
    // or a helper function. Here we just pretend based on some potential data or default to 'met'.
    const getStatus = (constraint: Constraint): "met" | "violated" | "warning" => {
        if (!selectedOption) return "met"; // Default state
        // Simple mock logic for visualization:
        if (constraint.type === "budget" && selectedOption.description.includes("Expensive")) return "violated";
        return "met";
    };

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-8">
                Guardrails & Constraints
            </h3>
            <div className="space-y-4">
                {constraints.map((constraint) => {
                    const status = getStatus(constraint);
                    return (
                        <div
                            key={constraint.id}
                            className={`
                    flex items-start gap-4 p-4 rounded-xl border text-sm transition-colors
                    ${status === "met" ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-200" :
                                    status === "violated" ? "bg-rose-950/20 border-rose-900/30 text-rose-200" :
                                        "bg-amber-950/20 border-amber-900/30 text-amber-200"
                                }
                `}
                        >
                            <div className="mt-0.5">
                                {status === "met" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {status === "violated" && <XCircle className="w-5 h-5 text-rose-500" />}
                                {status === "warning" && <AlertCircle className="w-5 h-5 text-amber-500" />}
                            </div>
                            <div>
                                <span className="font-medium block mb-1 uppercase tracking-wider text-xs">{constraint.label}</span>
                                <span className="text-sm opacity-70 leading-relaxed">{constraint.description}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
