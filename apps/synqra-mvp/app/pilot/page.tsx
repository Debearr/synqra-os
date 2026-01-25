import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LuxuryCheck, LuxuryArrow, BarcodeMotif } from "@/components/icons/LuxuryIcons";

export default function PilotPage() {
    return (
        <div className="min-h-screen bg-brand-bg text-white flex flex-col items-center justify-center py-20 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-20 right-20 opacity-20 rotate-12">
                <BarcodeMotif size={200} />
            </div>
            <div className="absolute bottom-20 left-20 opacity-20 -rotate-12">
                <BarcodeMotif size={150} />
            </div>

            <div className="container px-4 md:px-6 max-w-4xl text-center space-y-12 relative z-10">
                {/* Header */}
                <div className="space-y-6">
                    <div className="inline-block px-5 py-2 rounded-full border-2 border-brand-gold/40 bg-brand-gold/10 text-brand-gold text-sm font-semibold tracking-[0.15em] uppercase shadow-glow-gold">
                        Invitation Only
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-luxury">
                        The Founder's <br />
                        <span className="text-gradient-gold">Pilot Program</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-brand-gray max-w-2xl mx-auto font-light">
                        Join the exclusive cohort of 50 founders shaping the future of real estate automation.
                        Direct access to engineering, priority features, and lifetime pricing.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="glass-panel p-8 rounded-2xl luxury-hover-lift hover:border-brand-gold/30 barcode-bg">
                        <h3 className="text-2xl font-display mb-6 text-white">
                            <span className="text-brand-gold">S</span>trategic Partner
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <LuxuryCheck className="mt-1 flex-shrink-0" />
                                <span className="text-brand-gray">Direct line to the CEO & CTO</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <LuxuryCheck className="mt-1 flex-shrink-0" />
                                <span className="text-brand-gray">Influence the product roadmap</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <LuxuryCheck className="mt-1 flex-shrink-0" />
                                <span className="text-brand-gray">Bi-weekly strategy calls</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-panel p-8 rounded-2xl luxury-hover-lift hover:border-brand-teal/30 barcode-bg">
                        <h3 className="text-2xl font-display mb-6 text-white">
                            <span className="text-brand-gold">E</span>xclusive Access
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <LuxuryCheck className="mt-1 flex-shrink-0" />
                                <span className="text-brand-gray">Early access to AI agents</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <LuxuryCheck className="mt-1 flex-shrink-0" />
                                <span className="text-brand-gray">Locked-in legacy pricing</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <LuxuryCheck className="mt-1 flex-shrink-0" />
                                <span className="text-brand-gray">White-glove onboarding</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* CTA */}
                <div className="pt-8 space-y-6">
                    <Link href="/pilot/apply">
                        <Button
                            size="lg"
                            className="h-16 px-12 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-semibold text-xl rounded-full transition-all duration-300 hover:shadow-glow-gold hover:scale-105"
                        >
                            Apply for Access <LuxuryArrow className="ml-2 !text-brand-bg w-6 h-6" />
                        </Button>
                    </Link>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-12 bg-brand-gold/30" />
                        <p className="text-sm text-brand-gray/60 uppercase tracking-[0.2em] font-medium">
                            Limited to 50 spots
                        </p>
                        <div className="h-px w-12 bg-brand-gold/30" />
                    </div>
                </div>
            </div>
        </div>
    );
}
