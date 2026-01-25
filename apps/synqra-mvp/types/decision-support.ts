import { z } from "zod";

// ============================================================
// CORE DECISION TYPES
// ============================================================

export type ImpactFactor = {
    dimension: "cost" | "velocity" | "risk" | "quality" | "brand";
    score: number; // -100 to 100
    description: string;
};

export type TradeOffMatrix = {
    dimensions: string[];
    data: Record<string, number[]>; // optionId -> [scores]
};

export type DecisionOption<T = any> = {
    id: string;
    label: string;
    description: string;
    value: T;
    impact_analysis: ImpactFactor[];
    tags?: string[];
    disabled?: boolean;
    disabledReason?: string;
};

export type OptionSet<T = any> = {
    id: string;
    context_id: string;
    title: string;
    description?: string;
    options: DecisionOption<T>[];
    tradeoffs?: TradeOffMatrix;
};

export type Constraint = {
    id: string;
    label: string;
    type: "must_have" | "must_not_have" | "budget" | "timeline";
    validator: (option: DecisionOption) => boolean; // Logic would be here, but for now we just store the description
    description: string;
};

export type ConstraintStatus = {
    constraintId: string;
    met: boolean;
    message?: string;
};

export type PromptEnvelope = {
    id: string;
    task: string;
    context: Record<string, any>;
    output_format: string;
    created_at: string;
    metadata?: Record<string, any>;
};

export type DecisionNode<T = any> = {
    id: string;
    type: "choice" | "approval" | "input";
    prompt: PromptEnvelope;
    options: OptionSet<T>;
    constraints: Constraint[];
    status: "pending" | "decided" | "skipped";
    selectedOptionId?: string;
};

export type AuditEvent = {
    id: string;
    timestamp: string;
    actor: string;
    action: "viewed" | "analyzed" | "selected" | "confirmed";
    targetId: string; // optionId or nodeId
    metadata?: Record<string, any>;
};

export type AuditTrail = {
    events: AuditEvent[];
};
