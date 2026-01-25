
import React from 'react';
import { motion } from 'framer-motion';
import { PipelineState } from './types';

// CORRECT PIPELINE ORDER v2.1.1
const STEPS: PipelineState[] = [
    'extracting',
    'validating',
    'brand-safety-precheck',
    'manual-verification',
    'generating',
    'streaming',
    'final-safety-check',
    'complete' // Visualization end state
];

interface PipelineProgressProps {
    currentState: PipelineState;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ currentState }) => {
    const currentIndex = STEPS.indexOf(currentState);

    return (
        <div className="w-full overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] px-4 py-4 bg-[#0A0A0A] border-b border-white/5 relative">

                {/* Connecting Line Background */}
                <div className="absolute left-6 right-6 top-1/2 h-[1px] bg-white/5 -z-0" />

                {STEPS.map((step, index) => {
                    if (step === 'complete') return null; // Don't render 'complete' node, just used for progress logic

                    const isActive = index === currentIndex;
                    const isPast = index < currentIndex;
                    const isFuture = index > currentIndex;

                    // Labels mapping for cleaner UI
                    const labels: Record<string, string> = {
                        'brand-safety-precheck': 'Safety Pre',
                        'manual-verification': 'Manual Verify',
                        'final-safety-check': 'Safety Final'
                    };

                    return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.15 : 1,
                                    backgroundColor: isActive ? '#0A0A0A' : isPast ? '#0A0A0A' : '#0A0A0A',
                                    borderColor: isActive ? '#14B8A6' : isPast ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                                    boxShadow: isActive ? '0 0 15px rgba(20, 184, 166, 0.4)' : isPast ? '0 0 0 transparent' : 'none'
                                }}
                                className={`
                    w-3 h-3 rounded-full border-2 mb-2
                    transition-all duration-300
                    ${isPast ? 'bg-brand-gold border-brand-gold' : ''}
                  `}
                            />

                            <span className={`
                    text-[9px] uppercase tracking-widest font-mono font-bold
                    ${isActive ? 'text-brand-teal' : isPast ? 'text-brand-gold' : 'text-white/20'}
                `}>
                                {labels[step] || step}
                            </span>

                            {/* Active Pulse Ring */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeRing"
                                    className="absolute top-0 w-3 h-3 rounded-full border border-brand-teal opacity-50"
                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
