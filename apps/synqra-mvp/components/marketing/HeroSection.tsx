import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LuxuryArrow, SynqraLogo, BarcodeMotif } from "@/components/icons/LuxuryIcons";

export default function HeroSection() {
    return (
        <section className="relative w-full py-40 md:py-48 lg:py-56 overflow-hidden bg-brand-bg barcode-bg">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-teal/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-10 right-10 opacity-30 rotate-45 mix-blend-overlay">
                <BarcodeMotif size={120} />
            </div>

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center space-y-10 text-center">
                    {/* Logo */}
                    <SynqraLogo className="mb-4" />

                    <div className="space-y-6 max-w-4xl">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-luxury">
                            The Operating System for{" "}
                            <br className="hidden sm:inline" />
                            <span className="relative inline-block">
                                <span className="text-brand-teal">Modern Real Estate</span>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/5 h-0.5 bg-brand-gold" />
                            </span>
                        </h1>
                        <p className="mx-auto max-w-[700px] text-brand-gray text-xl md:text-2xl font-light">
                            Automate compliance, generate listing content in{" "}
                            <span className="text-brand-teal font-medium">90 seconds</span>, and close deals faster.
                            <br />
                            Synqra handles the admin so you can handle the sales.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="h-16 px-10 bg-brand-teal hover:bg-brand-teal/90 text-brand-bg font-semibold text-lg rounded-full transition-all duration-300 hover:shadow-glow hover:scale-105"
                            >
                                Start Free Trial <LuxuryArrow className="ml-2 !text-brand-bg w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/demo">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-16 px-10 border-white/10 text-white hover:bg-white/5 hover:text-white hover:border-white/30 font-medium text-lg rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                            >
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
