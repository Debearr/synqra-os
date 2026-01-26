import React from 'react';
import { ProbabilityCloud } from './ProbabilityCloud';
import { NowAnchor } from './NowAnchor';
import { LogicTraceRibbon } from './LogicTraceRibbon';
import { ShareSafeWatermark } from './ShareSafeWatermark';

interface AuraFXProps {
    className?: string;
    data?: any; // To be typed strictly later
}

export const AuraFXContainer: React.FC<AuraFXProps> = ({ className, data }) => {
    return (
        <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
            {/* Background Layer - Watermark enforced at specific Z-index */}
            <div className="absolute inset-0 z-[0] pointer-events-none">
                <ShareSafeWatermark />
            </div>

            {/* Intelligence Layer - Probability Cloud */}
            <div className="absolute inset-0 z-[10]">
                <ProbabilityCloud />
            </div>

            {/* Provenance Layer - Logic Traces entering the cloud */}
            <div className="absolute inset-0 z-[20] pointer-events-none">
                <LogicTraceRibbon />
            </div>

            {/* Temporal Layer - The Hard Edge of Now */}
            <div className="absolute inset-0 z-[30] pointer-events-none">
                <NowAnchor />
            </div>
        </div>
    );
};
