import { FusionEntry } from '../types';

export interface ValidationResult {
    ok: boolean;
    error?: string;
}

export function validateFusionEntry(fusion: FusionEntry): ValidationResult {
    if (!fusion) {
        return { ok: false, error: 'Entry is null or undefined' };
    }

    if (!fusion.id || typeof fusion.id !== 'string') {
        return { ok: false, error: 'Missing or invalid ID' };
    }

    if (!fusion.raw) {
        return { ok: false, error: 'Missing raw data' };
    }

    if (!fusion.insights) {
        return { ok: false, error: 'Missing insights' };
    }

    if (!fusion.timestamp || isNaN(Date.parse(fusion.timestamp))) {
        return { ok: false, error: 'Invalid timestamp' };
    }

    // Check for undefined fields at the top level
    for (const key in fusion) {
        if ((fusion as any)[key] === undefined) {
            return { ok: false, error: `Field '${key}' is undefined` };
        }
    }

    return { ok: true };
}
