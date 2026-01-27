/**
 * AuraFX Signal Validation Guards
 * Phase 1: Signal System Validation
 * 
 * STRICT ENFORCEMENT of "Intelligence Only" policy.
 */

import { AuraSignal, SignalValidationResult } from '../types';

// Banned words that imply a transaction/command
const TRANSACTIONAL_KEYWORDS = [
    'buy', 'sell',
    'long', 'short',
    'entry', 'enter',
    'exit',
    'stop loss', 'sl',
    'take profit', 'tp',
    'target',
    'pump', 'dump'
];

/**
 * Validates if a signal is safe to publish.
 * Returns valid: false if ANY transactional intent is detected.
 */
export function validateSignalSafety(signal: AuraSignal): SignalValidationResult {
    const reasons: string[] = [];
    const lowerContext = signal.context.toLowerCase();

    // 1. Check for Banned Keywords
    const foundKeywords = TRANSACTIONAL_KEYWORDS.filter(word => {
        // strict word boundary matching to avoid false positives (e.g., "shortly")
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerContext);
    });

    if (foundKeywords.length > 0) {
        reasons.push(`Context contains transactional keywords: ${foundKeywords.join(', ')}`);
    }

    // 2. Check Confidence Bounds
    if (signal.confidence >= 1.0) {
        reasons.push('Confidence cannot be 1.0 (Certainty is impossible)');
    }
    if (signal.confidence <= 0.0) {
        reasons.push('Confidence cannot be 0.0 (Noise filter failed)');
    }

    // 3. Time Validity Checks
    if (signal.validityPeriod.end <= signal.validityPeriod.start) {
        reasons.push('Validity period invalid (End time must be after Start time)');
    }

    if (signal.validityPeriod.end < Date.now()) {
        reasons.push('Signal is already expired upon validation');
    }

    // 4. Direction Checks
    // We strictly check the enum in TS, but runtime check ensures no data poisoning
    if (!['UP', 'DOWN', 'NEUTRAL'].includes(signal.direction)) {
        reasons.push(`Invalid direction: ${signal.direction}`);
    }

    return {
        isValid: reasons.length === 0,
        reasons
    };
}
