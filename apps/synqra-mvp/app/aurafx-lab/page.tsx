import React, { useState, useEffect } from 'react';
import { AuraFXContainer } from '@/features/aurafx/components/AuraFXContainer';
import { AuraSignal } from '@/features/aurafx/types';

export default function AuraFXLabPage() {
    const [signal, setSignal] = useState<AuraSignal | null>(null);

    // Mock Generators
    const generateSignal = (direction: 'UP' | 'DOWN') => {
        const now = Date.now();
        const newSignal: AuraSignal = {
            id: crypto.randomUUID(),
            symbol: 'BTC-USD',
            timestamp: now,
            type: 'MOMENTUM',
            direction,
            confidence: 0.85,
            context: direction === 'UP' ? 'Strong upward accumulation' : 'Heavy selling pressure',
            riskLevel: 'LOW',
            validityPeriod: {
                start: now - 1000,
                end: now + 60000 // 1 min life
            }
        };
        setSignal(newSignal);
    };

    const generateStaleSignal = () => {
        const now = Date.now();
        const newSignal: AuraSignal = {
            id: crypto.randomUUID(),
            symbol: 'BTC-USD',
            timestamp: now - 50000,
            type: 'VOLATILITY',
            direction: 'UP',
            confidence: 0.6,
            context: 'Old volatility spike',
            riskLevel: 'MEDIUM',
            validityPeriod: {
                start: now - 55000,
                end: now - 5000 // Expired 5s ago
            }
        };
        setSignal(newSignal);
    };

    // Re-render loop to show decay animation (rudimentary)
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="w-full h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
            <div className="absolute top-4 left-4 z-50 text-white font-mono text-sm opacity-50">
                AuraFX Visual Validation Lab
            </div>

            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => generateSignal('UP')}
                    className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs hover:bg-green-800/50"
                >
                    Gen Bullish
                </button>
                <button
                    onClick={() => generateSignal('DOWN')}
                    className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-800 rounded text-xs hover:bg-red-800/50"
                >
                    Gen Bearish
                </button>
                <button
                    onClick={generateStaleSignal}
                    className="px-3 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded text-xs hover:bg-gray-700"
                >
                    Gen Stale
                </button>
                <button
                    onClick={() => setSignal(null)}
                    className="px-3 py-1 bg-black text-white border border-white/20 rounded text-xs hover:bg-white/10"
                >
                    Clear
                </button>
            </div>

            {/* 
        Container forced to specific aspect ratio or size to simulate dashboard usage 
      */}
            <div className="w-[800px] h-[400px] border border-white/10 rounded-lg overflow-hidden relative shadow-2xl shadow-blue-900/5">
                <AuraFXContainer signal={signal} />
            </div>

            {/* Debug Info */}
            <div className="mt-8 p-4 w-[800px] bg-white/5 rounded text-[10px] font-mono text-white/50">
                <div>Signal ID: {signal?.id ?? 'N/A'}</div>
                <div>Direction: {signal?.direction ?? 'N/A'}</div>
                <div>Confidence: {signal?.confidence ?? 'N/A'}</div>
                <div>Context: {signal?.context ?? 'N/A'}</div>
            </div>

            <div className="absolute bottom-10 text-white/30 text-xs font-mono">
                Phase 2: Visual Layer Wiring
            </div>
        </main>
    );
}
