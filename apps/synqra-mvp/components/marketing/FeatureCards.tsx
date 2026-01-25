import { LightningBolt, LuxuryDiamond, LuxuryTarget } from "@/components/icons/LuxuryIcons";

export default function FeatureCards() {
    return (
        <section className="w-full py-24 bg-brand-bg border-t border-white/5">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Card 1 */}
                    <div className="glass-panel group relative overflow-hidden flex flex-col items-center space-y-4 text-center p-8 rounded-2xl luxury-hover-lift hover:border-brand-teal/30 barcode-bg">
                        <div className="p-4 bg-brand-teal/10 rounded-full border border-white/5 group-hover:bg-brand-teal/20 group-hover:border-brand-teal/30 transition-all duration-500">
                            <LightningBolt className="w-8 h-8 group-hover:rotate-6 transition-transform duration-300" />
                        </div>
                        <h3 className="text-xl text-white font-medium">
                            <span className="text-brand-gold">A</span>I Content Generation
                        </h3>
                        <p className="text-brand-gray font-light">
                            Turn raw property photos into SEO-optimized descriptions for Property24 and Private Property in seconds.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="glass-panel group relative overflow-hidden flex flex-col items-center space-y-4 text-center p-8 rounded-2xl luxury-hover-lift hover:border-brand-gold/30 barcode-bg">
                        <div className="p-4 bg-brand-gold/10 rounded-full border border-white/5 group-hover:bg-brand-gold/20 group-hover:border-brand-gold/30 transition-all duration-500">
                            <LuxuryDiamond className="w-8 h-8 !text-brand-gold group-hover:rotate-6 transition-transform duration-300" />
                        </div>
                        <h3 className="text-xl text-white font-medium">
                            <span className="text-brand-gold">A</span>utomated FICA
                        </h3>
                        <p className="text-brand-gray font-light">
                            Collect, verify, and store FICA documents securely. We chase the clients so you don't have to.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="glass-panel group relative overflow-hidden flex flex-col items-center space-y-4 text-center p-8 rounded-2xl luxury-hover-lift hover:border-brand-teal/30 barcode-bg">
                        <div className="p-4 bg-brand-teal/10 rounded-full border border-white/5 group-hover:bg-brand-teal/20 group-hover:border-brand-teal/30 transition-all duration-500">
                            <LuxuryTarget className="w-8 h-8 group-hover:rotate-6 transition-transform duration-300" />
                        </div>
                        <h3 className="text-xl text-white font-medium">
                            <span className="text-brand-gold">S</span>mart Compliance
                        </h3>
                        <p className="text-brand-gray font-light">
                            Never miss a document. Our dashboard tracks every deal's compliance status in real-time.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
