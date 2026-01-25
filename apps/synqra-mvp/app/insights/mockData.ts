import type { FusionEntry } from "./types";

export const mockFusionData: FusionEntry[] = [
    {
        id: "mock-1",
        timestamp: new Date().toISOString(),
        source: "fusion",
        raw: {
            id: "raw-mock-1",
            timestamp: new Date().toISOString(),
            source: "mock-source",
            category: "listing",
            content: { event: "new_upload", payload: { dummy: true } }
        },
        insights: {
            rawId: "raw-mock-1",
            insight: "Mock insight for new listing upload.",
            recommendedAction: "none",
            severity: "low",
            tags: ["mock"]
        },
        severity: "low",
        actionRecommendation: "none"
    }
];
