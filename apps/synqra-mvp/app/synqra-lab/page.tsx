"use client";

import React, { useState } from "react";
import {
    PromptEnvelope,
    OptionSet,
    WorkflowStage
} from "../../types/synqra-workflow";
import { SynqraLayout } from "../../components/synqra/SynqraLayout";
import { BriefView } from "../../components/synqra/BriefView";
import { OptionSetRenderer } from "../../components/synqra/OptionSetRenderer";
import { TradeOffMatrix } from "../../components/synqra/TradeOffMatrix";
import { HandoffSummary } from "../../components/synqra/HandoffSummary";

// --- MOCK DATA ---
const MOCK_BRIEF: PromptEnvelope = {
    id: "br-001",
    task: "Develop Visual Identity for 'Zero-Trust' Security Product",
    context: {
        client: "FinTech Corp",
        budget: "$150k",
        deadline: "2 Weeks",
        constraints: "Must align with existing 'Trust' guidelines"
    },
    output_format: "Visual Style Guide + 3 Key Visuals",
    created_at: new Date().toISOString()
};

const MOCK_OPTIONS: OptionSet = {
    id: "os-001",
    context_id: "br-001",
    title: "Visual Directions",
    options: [
        {
            id: "opt-1",
            label: "Absolute Zero",
            description: "A stark, void-like aesthetic using negative space to imply security. 'Nothing gets in.'",
            value: {
                theme: "Minimalist / Void",
                rationale: "Aligns with the 'Zero' in Zero-Trust completely.",
                assets: []
            },
            impact_analysis: [],
            tags: ["bold", "minimal", "risk-high"]
        },
        {
            id: "opt-2",
            label: "Digital Fortress",
            description: "Architectural, structural visuals. Complex geometry forming impenetrable barriers.",
            value: {
                theme: "Geometric / Structural",
                rationale: "Conveys strength and complexity visibly.",
                assets: []
            },
            impact_analysis: [],
            tags: ["corporate", "safe", "detailed"]
        },
        {
            id: "opt-3",
            label: "Bioluminescent",
            description: "Organic security. Glowing veins of verified data in a dark environment.",
            value: {
                theme: "Organic / Cyber",
                rationale: "Shows the 'life' of the data being protected.",
                assets: []
            },
            impact_analysis: [],
            tags: ["modern", "tech", "vibrant"]
        }
    ],
    tradeoffs: {
        dimensions: ["Brand Fit", "Production Cost", "Differentiation"],
        data: {
            "opt-1": [90, 20, 95], // High diff, low cost
            "opt-2": [70, 60, 40], // Safe, mid cost
            "opt-3": [50, 80, 80]  // High cost, high diff
        }
    }
};

export default function SynqraLabPage() {
    const [stage, setStage] = useState<WorkflowStage>("brief");
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const selectedOption = MOCK_OPTIONS.options.find(o => o.id === selectedId);

    // Workflow Controller
    const advance = () => {
        if (stage === "brief") setStage("options");
        else if (stage === "options") setStage("analysis");
        else if (stage === "analysis" && selectedId) setStage("handoff");
    };

    const back = () => {
        if (stage === "options") setStage("brief");
        else if (stage === "analysis") setStage("options");
        else if (stage === "handoff") setStage("analysis");
    };

    return (
        <SynqraLayout context={MOCK_BRIEF} currentStage={stage}>

            {/* VIEW ROUTER */}
            {stage === "brief" && (
                <BriefView brief={MOCK_BRIEF} />
            )}

            {stage === "options" && (
                <OptionSetRenderer
                    options={MOCK_OPTIONS}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            )}

            {stage === "analysis" && (
                <TradeOffMatrix options={MOCK_OPTIONS} selectedId={selectedId} />
            )}

            {stage === "handoff" && selectedOption && (
                <HandoffSummary selectedOption={selectedOption} />
            )}

            {/* CONTROLS (Floating Footer) */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex justify-between items-end">
                <div className="pointer-events-auto">
                    {stage !== "brief" && (
                        <button onClick={back} className="px-6 py-2 text-neutral-400 hover:text-white transition-colors text-sm">
                            &larr; Back
                        </button>
                    )}
                </div>

                <div className="pointer-events-auto">
                    {stage !== "handoff" && (
                        <button
                            onClick={advance}
                            disabled={stage === "options" && !selectedId}
                            className={`
                            px-8 py-3 rounded-full font-medium transition-all
                            ${(stage === "options" && !selectedId)
                                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/10"}
                        `}
                        >
                            {stage === "analysis" ? "Confirm Decision" : "Next Step"}
                        </button>
                    )}
                </div>
            </div>

        </SynqraLayout>
    );
}
