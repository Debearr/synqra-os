// Importing from the sibling app directly for MVP speed
// In a full prod setup, this should be a shared package
import type { FusionEntry } from '../../../synqra-os-intake/src/types';

export type { FusionEntry };

export interface AdaptedFusionEntry {
    id: string;
    timestamp: string | number;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    action: string;
    raw: any;
    insights: any;
}

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export type InsightCategory = 'log' | 'screenshot' | 'listing' | 'compliance' | 'workflow' | 'other';

export interface InsightFilter {
    severity?: InsightSeverity[];
    category?: InsightCategory[];
    startDate?: string;
    endDate?: string;
}
