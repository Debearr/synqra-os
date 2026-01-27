import React, { useMemo } from 'react';
import { ProbabilityCloud } from './ProbabilityCloud';
import { NowAnchor } from './NowAnchor';
import { LogicTraceRibbon } from './LogicTraceRibbon';
import { ShareSafeWatermark } from './ShareSafeWatermark';
import { AuraSignal } from '../types';
import { mapSignalToVisuals } from '../wiring/mapper';

interface AuraFXProps {
    className?: string;
    signal?: AuraSignal | null;
}

export const AuraFXContainer: React.FC<AuraFXProps> = ({ className, signal = null }) => {
    // Phase 2: Wiring
    // Calculate visual state from signal derived values
    // In a real implementation we might use a hook to update time-dependent decay (e.g. useCurrentTime())
    // For now, we calculate based on render time.
    const visualState = useMemo(() => mapSignalToVisuals(signal, Date.now()), [signal]);

    return (
        <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
            {/* Background Layer - Watermark enforced at specific Z-index */}
            <div className="absolute inset-0 z-[0] pointer-events-none">
                <ShareSafeWatermark />
            </div>

            {/* Intelligence Layer - Probability Cloud */}
            <div className="absolute inset-0 z-[10]">
                <ProbabilityCloud
                    opacity={visualState.cloud.opacity}
                    skew={visualState.cloud.skew}
                    intensity={visualState.cloud.intensity}
                    isStale={visualState.cloud.isStale}
                />
            </div>

            {/* Provenance Layer - Logic Traces entering the cloud */}
            <div className="absolute inset-0 z-[20] pointer-events-none">
                <LogicTraceRibbon
                    active={visualState.traces.active}
                    roots={visualState.traces.roots}
                />
            </div>

            {/* Temporal Layer - The Hard Edge of Now */}
            <div className="absolute inset-0 z-[30] pointer-events-none">
                <NowAnchor status={visualState.anchor.status} />
            </div>

            {/* 
               DEBUG / LAB RELIANCE 
               Hidden in production, but vital for confirming data passthrough in Lab
            */}
            {/* <div className="absolute top-0 right-0 text-[8px] text-green-500 font-mono z-50">
                {signal?.confidence.toFixed(2) ?? 'No Signal'}
            </div> */}
        </div>
    );
};
