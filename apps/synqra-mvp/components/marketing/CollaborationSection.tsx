import React from "react";
import { SynqraDualMarkGlyph } from "@/components/brand/synqra/glyphs/react/SynqraDualMarkGlyph";

const CollaborationSection = () => {
    return (
        <section className="w-full py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 flex flex-col items-center">
                <div className="text-center mb-16 max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-display font-medium text-white mb-4 tracking-luxury">
                        Powered by <span className="text-brand-gold">Intelligence</span>
                    </h2>
                    <p className="text-brand-gray text-lg">
                        Synqra integrates seamlessly with the NØID ecosystem to deliver executive-grade automation.
                    </p>
                </div>

                <div className="relative p-12 glass-panel rounded-2xl flex items-center justify-center">
                    <div className="absolute inset-0 bg-brand-teal/5 rounded-2xl blur-xl" />
                    <SynqraDualMarkGlyph
                        width={400}
                        height={128}
                        className="relative z-10 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                    />
                </div>
            </div>
        </section>
    );
};

export default CollaborationSection;
