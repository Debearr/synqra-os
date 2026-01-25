export interface RawData {
    id: string;
    timestamp: string;
    source: string;
    category: 'log' | 'screenshot' | 'listing' | 'compliance' | 'workflow' | 'other';
    content: any;
    metadata?: Record<string, any>;
}

export interface Insight {
    rawId: string;
    insight: string;
    recommendedAction: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    patternDetected?: string;
}

export interface IntakeEntry {
    raw: RawData;
    insight: Insight;
    processedAt: string;
    status: 'pending' | 'success' | 'failed';
}

export interface PipelineTarget {
    name: string;
    write(entry: FusionEntry): Promise<boolean>;
}

export interface FusionEntry {
    id: string;
    timestamp: string;
    source: 'fusion';
    raw: RawData;
    insights: Insight;
    severity: Insight['severity'];
    actionRecommendation: string;
}
