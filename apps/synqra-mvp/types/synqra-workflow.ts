import { z } from "zod";

// ============================================================
// SYNQRA CREATIVE WORKFLOW TYPES
// ============================================================

// 1. Context / Input
export type PromptEnvelope = {
    id: string;
    task: string;
    context: Record<string, any>;
    output_format: string;
    created_at: string;
};

// 2. Creative Options
export type CreativeOptionValue = {
    theme: string;
    rationale: string;
    assets: string[]; // e.g., placeholders for images
};

export type ImpactFactor = {
    dimension: "cost" | "velocity" | "risk" | "quality" | "brand";
    score: number; // -100 to 100
    description: string;
};

export type CreativeOption = {
    id: string;
    label: string;
    description: string;
    value: CreativeOptionValue;
    impact_analysis: ImpactFactor[];
    tags: string[];
};

export type OptionSet = {
    id: string;
    context_id: string;
    title: string;
    description?: string;
    options: CreativeOption[];
    tradeoffs?: TradeOffMatrix;
};

// 3. Analysis
export type TradeOffMatrix = {
    dimensions: string[];
    data: Record<string, number[]>; // optionId -> [scores]
};

// 4. Workflow State
export type WorkflowStage = "brief" | "options" | "analysis" | "handoff";

export type SynqraWorkflowState = {
    stage: WorkflowStage;
    brief: PromptEnvelope;
    options?: OptionSet;
    selectedOptionId?: string;
    constraintsValidated: boolean;
    history: AuditEvent[];
};

// 5. Audit
export type AuditEvent = {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    targetId: string;
};

export type Constraint = {
    id: string;
    label: string;
    description: string;
    type: "must_have" | "budget" | "timeline";
};
