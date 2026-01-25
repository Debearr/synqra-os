import HeroSection from "@/components/marketing/HeroSection";
import FeatureCards from "@/components/marketing/FeatureCards";
import SocialProof from "@/components/marketing/SocialProof";
import { SynqraHeroGlyph } from "@/components/brand/synqra/glyphs/react/SynqraHeroGlyph";
import CollaborationSection from "@/components/marketing/CollaborationSection";

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center min-h-screen bg-brand-bg relative overflow-hidden">
            {/* Background Hero Glyph */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] pointer-events-none z-0 opacity-20">
                <SynqraHeroGlyph className="w-full h-auto text-brand-gold mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
                <HeroSection />
                <SocialProof />
                <CollaborationSection />
                <FeatureCards />
            </div>
        </div>
    );
}

