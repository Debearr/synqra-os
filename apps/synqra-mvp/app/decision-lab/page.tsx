"use client";

import React, { useState } from "react";
import {
    PromptEnvelope,
    OptionSet,
    Constraint,
    AuditTrail
} from "../../types/decision-support";
import { DecisionLayout } from "../../components/decision/DecisionLayout";
import { ScenarioHeader } from "../../components/decision/ScenarioHeader";
import { OptionSetRenderer } from "../../components/decision/OptionSetRenderer";
import { TradeOffMatrix } from "../../components/decision/TradeOffMatrix";
import { ConstraintChecklist } from "../../components/decision/ConstraintChecklist";
import { AuditLogViewer } from "../../components/decision/AuditLogViewer";

// --- MOCK DATA ---
const MOCK_CONTEXT: PromptEnvelope = {
    id: "task-1234",
    task: "Generate Q4 Marketing Campaign Concepts for 'Synqra OS'",
    context: {
        target_audience: "Enterprise CTOs",
        key_theme: "Autonomy without loss of control",
        budget: "$50k - $100k",
        deadline: "2025-11-15"
    },
    output_format: "Strategic Campaign Brief",
    created_at: new Date().toISOString()
};

const MOCK_OPTIONS: OptionSet = {
    id: "os-001",
    context_id: "task-1234",
    title: "Campaign Directions",
    description: "Three distinct strategic approaches generated based on the brief.",
    options: [
        {
            id: "opt-a",
            label: "The 'Silent Operator' Strategy",
            description: "Focus on the 'invisible' nature of Synqra. Dark, minimalist visuals. Tagline: 'It works so you don't have to.' Emphasis on background efficiency.",
            value: { theme: "minimalism" },
            impact_analysis: [
                { dimension: "brand", score: 95, description: "Highly aligned with premium identity" },
                { dimension: "risk", score: -20, description: "Might be too subtle for new leads" },
                { dimension: "cost", score: 50, description: "Requires high-end CGI" }
            ]
        },
        {
            id: "opt-b",
            label: "The 'Command Center' Strategy",
            description: "Focus on the dashboard and control. UI-heavy visuals showing the 'God Mode' view. Tagline: 'Total control, zero friction.'",
            value: { theme: "ui-focused" },
            impact_analysis: [
                { dimension: "brand", score: 80, description: "Strong product focus" },
                { dimension: "velocity", score: 90, description: "Fast to produce using existing assets" },
                { dimension: "quality", score: 75, description: "Standard tech marketing vibe" }
            ]
        },
        {
            id: "opt-c",
            label: "The 'Future Workforce' Strategy",
            description: "Narrative-driven approach featuring human-AI collaboration. Storytelling focus. Tagline: 'Your new best employee is code.'",
            value: { theme: "narrative" },
            impact_analysis: [
                { dimension: "risk", score: 40, description: "Narrative can be polarized" },
                { dimension: "cost", score: -80, description: "Expensive live-action shoot required" },
                { dimension: "brand", score: 60, description: "Slightly deviates from core minimalist style" }
            ]
        }
    ],
    tradeoffs: {
        dimensions: ["Brand Alignment", "Speed to Market", "Cost Efficiency"],
        data: {
            "opt-a": [95, 40, 50],
            "opt-b": [80, 90, 85],
            "opt-c": [60, 20, 10]
        }
    }
};

const MOCK_CONSTRAINTS: Constraint[] = [
    {
        id: "c1",
        label: "Must use 'Matte Black' aesthetic",
        type: "must_have",
        description: "All visuals must adhere to the core brand palette.",
        validator: () => true
    },
    {
        id: "c2",
        label: "Budget under $75k",
        type: "budget",
        description: "Campaign production cannot exceed allocating budget.",
        validator: () => true
    }
];

const MOCK_AUDIT: AuditTrail = {
    events: [
        {
            id: "e1",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            actor: "System",
            action: "analyzed",
            targetId: "task-1234",
            metadata: { detail: "Parsed brief and generated 3 options" }
        },
        {
            id: "e2",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            actor: "User (De Bear)",
            action: "viewed",
            targetId: "os-001"
        }
    ]
};

// --- PAGE COMPONENT ---

export default function DecisionLabPage() {
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const selectedOption = MOCK_OPTIONS.options.find(o => o.id === selectedId);

    return (
        <div className="min-h-screen bg-black text-white">
            <DecisionLayout context={MOCK_CONTEXT}>
                <ScenarioHeader prompt={MOCK_CONTEXT} />

                <div className="space-y-16 pb-16">
                    {/* 1. Option Selection Stage */}
                    <section>
                        <OptionSetRenderer
                            optionSet={MOCK_OPTIONS}
                            selectedOptionId={selectedId}
                            onSelect={setSelectedId}
                        />
                    </section>

                    {/* 2. Analysis Stage (Two Columns) */}
                    {selectedId && (
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="lg:col-span-2">
                                <TradeOffMatrix
                                    optionSet={MOCK_OPTIONS}
                                    selectedOptionId={selectedId}
                                />
                            </div>
                            <div>
                                <ConstraintChecklist
                                    constraints={MOCK_CONSTRAINTS}
                                    selectedOption={selectedOption}
                                />
                            </div>
                        </section>
                    )}

                    {/* 3. Decision Audit */}
                    <AuditLogViewer auditTrail={MOCK_AUDIT} />

                    {/* Floating Action Bar */}
                    {selectedId && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8">
                            <div className="text-sm">
                                <span className="text-neutral-500 mr-2 uppercase tracking-wider">Selected:</span>
                                <span className="text-white font-medium">{selectedOption?.label}</span>
                            </div>
                            <div className="h-4 w-px bg-neutral-800" />
                            <button className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">
                                Confirm Decision &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </DecisionLayout>
        </div>
    );
}
