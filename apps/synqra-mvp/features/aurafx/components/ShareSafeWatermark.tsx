import React from 'react';

export const ShareSafeWatermark: React.FC = () => {
    // In a real implementation, these would come from a secure context or prop
    const timestamp = new Date();
    const expiry = new Date(timestamp.getTime() + 1000 * 60 * 15); // 15 min expiry

    // Formatting helper
    const fmt = (d: Date) => d.toISOString().split('T')[1].slice(0, 8);

    return (
        <div className="w-full h-full flex flex-col justify-between p-4 opacity-30 select-none">
            {/* Repeated Background Pattern could go here via CSS mask, keeping it simple DOM for now */}
            <div className="absolute inset-0 flex flex-wrap content-start opacity-[0.03] overflow-hidden pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => (
                    <span key={i} className="text-xs font-mono m-8 rotate-[-15deg] whitespace-nowrap">
                        NON-TRANSACTIONAL // INTELLIGENCE ONLY
                    </span>
                ))}
            </div>

            <div className="relative z-50 flex justify-between items-end text-[10px] text-synqra-gold font-mono tracking-wider">
                <div className="flex flex-col gap-1">
                    <span>LIMITED LICENSE: ANALYTICAL USE ONLY</span>
                    <span>ID: SESS-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                    <span>GEN: {fmt(timestamp)}</span>
                    <span className="text-red-400">EXP: {fmt(expiry)}UTC</span>
                </div>
            </div>
        </div>
    );
};
