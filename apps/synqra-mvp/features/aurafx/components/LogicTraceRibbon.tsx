import React from 'react';

interface LogicTraceRibbonProps {
    active: boolean;
    roots: string[];
}

export const LogicTraceRibbon: React.FC<LogicTraceRibbonProps> = ({ active, roots }) => {
    // If not active, render nothing or very faint
    if (!active) return null;

    // Use roots to determine Y positions pseudo-randomly but deterministically
    // This simulates "Logic Lines" converging on the signal
    const traces = roots.map((root, i) => ({
        id: i,
        source: root,
        weight: 0.8,
        y: 20 + (i * 30) // Spread them out
    }));

    // Fallback if no specific roots, show generic trace
    if (traces.length === 0) {
        traces.push({ id: 0, source: 'SIGNAL', weight: 0.5, y: 50 });
    }

    const nowX = 70; // Must match NowAnchor

    return (
        <div className="absolute inset-0 w-full h-full animate-in fade-in duration-1000">
            <svg className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="trace-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4B5563" stopOpacity="0.1" />
                        <stop offset="80%" stopColor="#D4AF37" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {traces.map((trace) => (
                    <g key={trace.id} className="group cursor-pointer">
                        {/* The Trace Line */}
                        <path
                            d={`M 0 ${trace.y} C ${nowX / 2} ${trace.y}, ${nowX / 2} 50, ${nowX} 50`}
                            fill="none"
                            stroke="url(#trace-grad)"
                            strokeWidth={trace.weight * 2}
                            vectorEffect="non-scaling-stroke"
                            className="transition-all duration-300 opacity-70 group-hover:opacity-100 group-hover:stroke-[3px]"
                        />

                        {/* Source Label at start */}
                        <text
                            x="5"
                            y={trace.y - 5}
                            fill="white"
                            fontSize="8"
                            className="opacity-40 group-hover:opacity-100 transition-opacity font-mono tracking-widest"
                        >
                            SOURCE: {trace.source}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};
