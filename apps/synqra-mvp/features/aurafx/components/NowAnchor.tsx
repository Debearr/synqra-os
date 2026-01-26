import React from 'react';

export const NowAnchor: React.FC = () => {
    // Layout position for "Now" - usually roughly 70% to show lead into future
    const nowXPercent = 70;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* The Hard Edge of Now - Vertical Line */}
            <div
                className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-50"
                style={{ left: `${nowXPercent}%` }}
            >
                <div className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono text-white/70">NOW</div>
            </div>

            {/* Past State - Degraded Visuals (Overlay) */}
            <div
                className="absolute top-0 bottom-0 left-0 bg-black/10 backdrop-grayscale-[50%] z-40 border-r border-white/10"
                style={{ width: `${nowXPercent}%` }}
                aria-label="Historical Data Region"
            />

            {/* Future State - Fluid Potential (Overlay) */}
            <div
                className="absolute top-0 bottom-0 right-0 z-40"
                style={{ left: `${nowXPercent}%` }}
                aria-label="Projected Probability Region"
            >
                {/* Subtle scanline or grain for future uncertainty could go here */}
                <div className="w-full h-full bg-gradient-to-r from-transparent to-black/50" />
            </div>
        </div>
    );
};
