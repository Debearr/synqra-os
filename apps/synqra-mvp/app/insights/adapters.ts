import type { FusionEntry, AdaptedFusionEntry } from "./types";

export function adaptFusionEntry(entry: FusionEntry): AdaptedFusionEntry {
    return {
        id: entry.id,
        timestamp: entry.timestamp,
        category: entry.raw.category ?? "unknown",
        severity: entry.severity ?? "low",
        action: entry.actionRecommendation ?? "none",
        raw: entry.raw,
        insights: entry.insights
    };
}

export function adaptFusionList(entries: FusionEntry[]): AdaptedFusionEntry[] {
    return entries.map(adaptFusionEntry);
}
