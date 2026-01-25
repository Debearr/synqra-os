import React from 'react';
import { InsightFilter } from '../types';

export interface InsightFiltersProps {
    onChange: (filter: InsightFilter) => void;
}

export function InsightFilters({ onChange }: InsightFiltersProps) {
    console.log("[SIV] Filters mounted");
    return null;
}
