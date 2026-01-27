/**
 * AuraFX Visual Mapper
 * Phase 2: Visual Layer Wiring
 * 
 * Maps the strict 'Intelligence' signal to 'Visual' properties.
 * strictly ONE-WAY: Signal -> Visuals
 */

import { AuraSignal, SignalState } from '../types';
import { calculateConfidence, getSignalState } from '../logic/lifecycle';

export interface VisualState {
    cloud: {
        opacity: number;
        skew: number; // -1 (bearish) to 1 (bullish)
        intensity: number; // 0-1
        isStale: boolean;
    };
    traces: {
        active: boolean;
        roots: string[]; // "Macro", "Flow", etc derived from context
    };
    anchor: {
        opacity: number;
        status: SignalState;
    };
}

export function mapSignalToVisuals(signal: AuraSignal | null, currentTime: number = Date.now()): VisualState {
    // 1. Default / Idle State
    if (!signal) {
        return {
            cloud: { opacity: 0, skew: 0, intensity: 0, isStale: false },
            traces: { active: false, roots: [] },
            anchor: { opacity: 0.3, status: SignalState.PENDING } // Dim anchor
        };
    }

    // 2. Lifecycle Check
    const state = getSignalState(signal, currentTime);
    const confidence = calculateConfidence(signal, currentTime);

    // 3. Cloud Mapping
    // Direction: UP -> Positive Skew, DOWN -> Negative Skew, NEUTRAL -> 0
    let skew = 0;
    if (signal.direction === 'UP') skew = 0.5;
    if (signal.direction === 'DOWN') skew = -0.5;

    // Modulate skew by confidence (Less confident = more centered/ambiguous)
    skew = skew * confidence;

    // Opacity Base
    let opacity = confidence;
    if (state === SignalState.DECAYING) {
        // Visual flicker or fade handled by CSS, but base opacity drops
        opacity = confidence * 0.8;
    }

    // 4. Trace Mapping (Extract roots from Context string simply for now)
    // In a real app, this might parse tags. Here we map "Momentum" -> "MOM" etc.
    const roots: string[] = [signal.type];

    return {
        cloud: {
            opacity: Math.max(0.1, opacity), // Never invisible if active
            skew,
            intensity: confidence,
            isStale: state === SignalState.DECAYING || state === SignalState.EXPIRED
        },
        traces: {
            active: confidence > 0.2, // Traces only appear if there's some signal
            roots
        },
        anchor: {
            opacity: 1, // Anchor is fully visible when signal is active
            status: state
        }
    };
}
