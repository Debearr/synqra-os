
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Wrench } from 'lucide-react';

interface BrandSafetyAlertProps {
    isOpen: boolean;
    score: number;
    flags: string[];
    onOverride: () => void;
    onRepair: () => void;
    onDiscard: () => void;
}

export const BrandSafetyAlert: React.FC<BrandSafetyAlertProps> = ({
    isOpen,
    score,
    flags,
    onOverride,
    onRepair,
    onDiscard
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="w-full max-w-lg bg-[#0A0A0A] border border-amber-500/50 rounded-lg shadow-[0_0_50px_rgba(217,119,6,0.1)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-amber-500/20 bg-amber-950/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/50 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-amber-500 font-display font-bold tracking-wide uppercase text-sm">Pre-Check Safety Alert</h3>
                            <p className="text-white/40 text-xs">Action Required Before Generation</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-amber-500/50 uppercase tracking-widest mb-1">Score</div>
                            <div className="text-3xl font-bold text-amber-500 font-display leading-none">{score}</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="p-4 bg-white/5 rounded border border-white/5 mb-6">
                            <h4 className="text-xs text-brand-gray uppercase tracking-widest mb-3">Detected Risks</h4>
                            <div className="flex flex-wrap gap-2">
                                {flags.map(flag => (
                                    <span key={flag} className="px-2 py-1 bg-amber-900/40 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase rounded">
                                        {flag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <p className="text-sm text-center text-white/60 px-4">
                            Asset cannot enter the generation pipeline without resolution.
                        </p>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-3 gap-1 p-4 border-t border-white/10 bg-black/40">
                        <button onClick={onDiscard} className="py-3 text-xs uppercase tracking-widest text-brand-gray hover:text-white transition-colors">
                            Discard
                        </button>
                        <button onClick={onRepair} className="py-3 text-xs uppercase tracking-widest text-brand-teal hover:bg-brand-teal/5 border border-transparent hover:border-brand-teal/20 rounded transition-all flex items-center justify-center gap-2">
                            <Wrench className="w-3 h-3" /> Repair
                        </button>
                        <button onClick={onOverride} className="py-3 text-xs uppercase tracking-widest text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/10 rounded font-bold transition-all">
                            Override
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
