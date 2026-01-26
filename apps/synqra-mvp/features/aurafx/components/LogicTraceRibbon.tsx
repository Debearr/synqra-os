import React from 'react';

export const LogicTraceRibbon: React.FC = () => {
    // Mock traces
    const traces = [
        { id: 1, source: 'Macro', weight: 0.8, y: 20 },
        { id: 2, source: 'Sentiment', weight: 0.4, y: 50 },
        { id: 3, source: 'Flow', weight: 0.9, y: 80 },
    ];

    const nowX = 70; // Must match NowAnchor

    return (
        <div className="absolute inset-0 w-full h-full">
            <svg className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="trace-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4B5563" stopOpacity="0.2" /> {/* Gray-600 */}
                        <stop offset="80%" stopColor="#D4AF37" stopOpacity="0.8" /> {/* Gold */}
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {traces.map((trace) => (
                    <g key={trace.id} className="group cursor-pointer">
                        {/* The Trace Line - Bezier curve from left input to 'Now' anchor point center */}
                        <path
                            d={`M 0 ${trace.y} C ${nowX / 2} ${trace.y}, ${nowX / 2} 50, ${nowX} 50`}
                            fill="none"
                            stroke="url(#trace-grad)"
                            strokeWidth={trace.weight * 3}
                            vectorEffect="non-scaling-stroke"
                            className="transition-all duration-300 opacity-50 group-hover:opacity-100 group-hover:stroke-[4px]"
                        />

                        {/* Source Label at start */}
                        <text
                            x="5"
                            y={trace.y - 5}
                            fill="white"
                            fontSize="8"
                            className="opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                        >
                            SOURCE: {trace.source}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};
