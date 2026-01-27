/**
 * AuraFX Signal Lifecycle Logic
 * Phase 1: Signal System Validation
 */

import { AuraSignal, SignalState } from '../types';

/**
 * Calculates the current state of a signal based on time.
 */
export function getSignalState(signal: AuraSignal, currentTime: number = Date.now()): SignalState {
    const { start, end } = signal.validityPeriod;

    if (currentTime < start) {
        return SignalState.PENDING;
    }

    if (currentTime > end) {
        return SignalState.EXPIRED;
    }

    // Optional: Logic for "DECAYING" state (e.g., last 20% of validity period)
    const duration = end - start;
    const elapsed = currentTime - start;
    const remaining = end - currentTime;

    if (remaining < duration * 0.2) {
        return SignalState.DECAYING;
    }

    return SignalState.ACTIVE;
}

/**
 * Calculates the current confidence of a signal.
 * Applies time-based decay if necessary.
 * 
 * STRICT RULE: Confidence MUST be < 1.0.
 */
export function calculateConfidence(signal: AuraSignal, currentTime: number = Date.now()): number {
    const state = getSignalState(signal, currentTime);

    if (state === SignalState.PENDING || state === SignalState.EXPIRED || state === SignalState.INVALID) {
        return 0;
    }

    let confidence = signal.confidence;

    // Sanity check: cap at 0.99
    if (confidence >= 1.0) {
        confidence = 0.99;
    }

    // Apply decay logic if in DECAYING state
    if (state === SignalState.DECAYING) {
        const { start, end } = signal.validityPeriod;
        const duration = end - start;
        const remaining = end - currentTime;

        // Linear decay from original confidence to 0 during the last 20% of life
        const decayPhaseDuration = duration * 0.2;
        const decayFactor = remaining / decayPhaseDuration;

        confidence = confidence * decayFactor;
    }

    // Final sanity floor
    return Math.max(0, confidence);
}
