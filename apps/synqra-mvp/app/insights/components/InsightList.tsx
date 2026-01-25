import React from 'react';
import type { AdaptedFusionEntry } from "../types";

export interface InsightListProps {
    entries: AdaptedFusionEntry[];
}

export function InsightList({ entries }: InsightListProps) {
    console.log("[SIV] InsightList entries:", entries.length);
    return (
        <div>
            {entries.map((e) => (
                <div key={e.id}>{e.id}</div>
            ))}
        </div>
    );
}
