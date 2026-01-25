import { RawData, Insight, FusionEntry } from './types';

/**
 * Composes a FusionEntry from raw data and insights.
 * Merges them into a single anonymous, privacy-safe object.
 * Pure function, no side effects.
 */
export function composeFusion(rawEntry: RawData, insightEntry: Insight): FusionEntry {
    // Ensure we are not leaking PII by creating a new object structure
    // The rawEntry should already be scrubbed by the collector, but we treat it as opaque here.

    return {
        id: rawEntry.id, // Keep ID consistent for tracing
        timestamp: rawEntry.timestamp,
        source: 'fusion',
        raw: {
            ...rawEntry,
            // Ensure we don't accidentally override critical fields if rawEntry is malformed
            id: rawEntry.id,
            timestamp: rawEntry.timestamp
        },
        insights: {
            ...insightEntry,
            // Ensure linkage is correct
            rawId: rawEntry.id
        },
        severity: insightEntry.severity,
        actionRecommendation: insightEntry.recommendedAction
    };
}
