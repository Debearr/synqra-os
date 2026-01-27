
// Shim for Jest-like syntax in standalone TSX run
function describe(name: string, fn: () => void) { console.log(`📦 ${name}`); fn(); }
function test(name: string, fn: () => void) { try { fn(); console.log(`  ✅ ${name}`); } catch (e: any) { console.error(`  ❌ ${name}`, e.message); process.exitCode = 1; } }
function expect(actual: any) {
    return {
        toBe: (exp: any) => { if (actual !== exp) throw new Error(`Expected ${exp}, got ${actual}`); },
        toBeGreaterThan: (exp: number) => { if (actual <= exp) throw new Error(`Expected > ${exp}, got ${actual}`); },
        toBeLessThan: (exp: number) => { if (actual >= exp) throw new Error(`Expected < ${exp}, got ${actual}`); },
        toContain: (exp: any) => { if (!actual.includes(exp)) throw new Error(`Expected ${actual} to contain ${exp}`); }
    };
}

/**
 * AuraFX Visual Mapper Tests
 * Phase 2: Visual Layer Wiring
 */

import { mapSignalToVisuals } from '../wiring/mapper';
import { AuraSignal, SignalState } from '../types';

describe('AuraFX Visual Mapper', () => {

    const now = Date.now();
    const validSignal: AuraSignal = {
        id: 'test-1',
        symbol: 'BTC-USD',
        timestamp: now,
        type: 'MOMENTUM',
        direction: 'UP',
        confidence: 0.8,
        context: 'Strong momentum',
        riskLevel: 'LOW',
        validityPeriod: {
            start: now - 1000,
            end: now + 9000
        }
    };

    test('Should map NULL signal to idle state', () => {
        const visuals = mapSignalToVisuals(null, now);
        expect(visuals.cloud.opacity).toBe(0);
        expect(visuals.cloud.intensity).toBe(0);
        expect(visuals.traces.active).toBe(false);
        expect(visuals.anchor.status).toBe(SignalState.PENDING);
    });

    test('Should map ACTIVE signal to visible cloud', () => {
        const visuals = mapSignalToVisuals(validSignal, now);
        expect(visuals.cloud.opacity).toBeGreaterThan(0.5);
        expect(visuals.cloud.intensity).toBe(0.8);
        expect(visuals.traces.active).toBe(true);
        expect(visuals.anchor.status).toBe(SignalState.ACTIVE);
    });

    test('Should map UP direction to Positive Skew', () => {
        const upSignal = { ...validSignal, direction: 'UP' as const };
        const visualUp = mapSignalToVisuals(upSignal, now);
        expect(visualUp.cloud.skew).toBeGreaterThan(0);

        const downSignal = { ...validSignal, direction: 'DOWN' as const };
        const visualDown = mapSignalToVisuals(downSignal, now);
        expect(visualDown.cloud.skew).toBeLessThan(0);
    });

    test('Should detect DECAYING state', () => {
        // Decaying starts in last 20%. Total 10000. Last 2000.
        // End is now + 9000. 
        // We need current time to be close to end.
        // Let's shift time forward in the mapper call.
        // End - 1000 = (now + 9000) - 1000 = now + 8000.

        const decayTime = now + 8000;
        const visuals = mapSignalToVisuals(validSignal, decayTime);

        expect(visuals.anchor.status).toBe(SignalState.DECAYING);
        expect(visuals.cloud.isStale).toBe(true);
        // Opacity should be reduced compared to raw confidence
        // Raw decay at 50% through decay period (1000/2000) -> 0.4
        // Then stale factor 0.8
        expect(visuals.cloud.opacity).toBeLessThan(0.8);
    });

    test('Should map Roots from context', () => {
        // Current mapper just uses Type as root.
        const visuals = mapSignalToVisuals(validSignal, now);
        expect(visuals.traces.roots).toContain('MOMENTUM');
    });

});
