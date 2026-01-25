import React from 'react';
import type { AdaptedFusionEntry } from "../types";

export interface InsightCardProps {
    entry: AdaptedFusionEntry;
}

export function InsightCard({ entry }: InsightCardProps) {
    return <div>{entry.id}</div>;
}
