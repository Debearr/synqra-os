
import React from 'react';
import { motion } from 'framer-motion';

export const ImageNormalizer: React.FC<{ src: string }> = ({ src }) => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-black group rounded-lg border border-white/10">
            <img
                src={src}
                className="w-full h-full object-contain opacity-60 grayscale-[50%] contrast-110 brightness-110 filter transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100"
                alt="Normalized View"
            />

            {/* Pipeline Stage Indicators */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
                <div className="px-2 py-0.5 bg-black/60 backdrop-blur text-[9px] text-brand-teal uppercase tracking-widest border border-brand-teal/30 rounded flex items-center gap-1">
                    <span className="w-1 h-1 bg-brand-teal rounded-full animate-pulse" /> CLAHE Applied
                </div>
                <div className="px-2 py-0.5 bg-black/60 backdrop-blur text-[9px] text-brand-teal uppercase tracking-widest border border-brand-teal/30 rounded flex items-center gap-1">
                    <span className="w-1 h-1 bg-brand-teal rounded-full animate-pulse" /> Brightness Norm
                </div>
                <div className="px-2 py-0.5 bg-black/60 backdrop-blur text-[9px] text-brand-teal uppercase tracking-widest border border-brand-teal/30 rounded flex items-center gap-1">
                    <span className="w-1 h-1 bg-brand-teal rounded-full animate-pulse" /> Palette Quantization
                </div>
            </div>

            {/* Histogram Overlay */}
            <div className="absolute bottom-3 right-3 pointer-events-none p-2 bg-black/80 backdrop-blur border border-white/10 rounded">
                <div className="flex items-end gap-0.5 h-6 w-16 opacity-60">
                    {[40, 65, 30, 80, 50, 90, 45, 60, 30, 40, 20, 50, 80, 40, 30].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: i * 0.03 }}
                            className="flex-1 bg-brand-teal"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
