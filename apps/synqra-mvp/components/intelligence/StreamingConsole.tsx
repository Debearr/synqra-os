
import React from 'react';
import { motion } from 'framer-motion';

type ModelType = 'gemini' | 'groq' | 'kie';

interface StreamingConsoleProps {
    activeModel: ModelType | null;  // Null means extraction/streaming not active
    streamText: string;
    isStreaming: boolean;
}

const BADGE_STYLES = {
    gemini: { label: 'GEMINI PRO 3', activeColor: 'text-teal-400', glow: 'shadow-[0_0_15px_rgba(20,184,166,0.6)] border-teal-500/60 bg-teal-950/20' },
    groq: { label: 'GROQ', activeColor: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.6)] border-orange-500/60 bg-orange-950/20' },
    kie: { label: 'KIE', activeColor: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)] border-blue-500/60 bg-blue-950/20' }
};

export const StreamingConsole: React.FC<StreamingConsoleProps> = ({ activeModel, streamText, isStreaming }) => {

    return (
        <div className="w-full max-w-3xl mx-auto font-mono">

            {/* Model Chain Visualizer - Atomic Locks */}
            <div className="flex items-center justify-center gap-6 mb-8">
                {(Object.keys(BADGE_STYLES) as ModelType[]).map((model, index) => {
                    const isActive = activeModel === model;
                    const style = BADGE_STYLES[model];

                    return (
                        <div key={model} className="flex items-center">
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.05 : 1,
                                    opacity: isActive ? 1 : 0.3,
                                }}
                                className={`
                                    px-4 py-2 rounded-full text-xs font-bold tracking-widest border transition-colors duration-300
                                    ${isActive
                                        ? `${style.activeColor} ${style.glow}`
                                        : 'text-gray-500 border-white/5 bg-transparent grayscale'}
                                `}
                            >
                                {style.label}
                            </motion.div>

                            {/* Arrow */}
                            {index < 2 && (
                                <div className="ml-6 text-white/5 text-xs">→</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Console Output */}
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#050505] h-[360px] shadow-2xl flex flex-col">
                {/* Header */}
                <div className="h-9 bg-white/[0.02] flex items-center px-4 gap-2 border-b border-white/5 select-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="ml-auto text-xs text-white/20 font-bold uppercase tracking-widest">
                        {activeModel ? `CONNECTED: ${activeModel.toUpperCase()}` : 'IDLE'}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 text-sm font-mono leading-relaxed overflow-y-auto custom-scrollbar">
                    <div className="text-brand-gray/40 mb-4 select-none">$ tail -f /var/log/synqra/stream.log</div>
                    <div className="text-brand-fg whitespace-pre-wrap font-medium">
                        {streamText}
                        {isStreaming && (
                            <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ repeat: Infinity, duration: 0.8, ease: "steps(2)" }}
                                className="inline-block w-2.5 h-5 bg-brand-gold ml-1 align-text-bottom"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
