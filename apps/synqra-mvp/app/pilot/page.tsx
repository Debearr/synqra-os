/**
 * Synqra Founder Pilot - Landing Page
 * 
 * This is the main entry point for the Founder Pilot Program.
 * A conversion-focused landing page showcasing the $97/7-day test drive offer.
 * 
 * Features:
 * - Hero section with clear value proposition
 * - Benefits highlighting time savings and results
 * - Social proof with testimonials
 * - Transparent pricing
 * - FAQ to handle objections
 * - Multiple CTAs throughout the page
 * 
 * Design Philosophy:
 * - Clean, premium aesthetic (Tesla × Apple × Virgil Abloh)
 * - Benefits-first storytelling, zero hype
 * - Direct, confident language without buzzwords
 * - Black/White/Teal/Gold color palette
 * 
 * TODO Phase 2: Wire CTA buttons to /pilot/apply route
 * TODO Phase 3: Add analytics tracking (PostHog/Plausible)
 * TODO Phase 4: A/B test headline variations
 * TODO Phase 5: Add video testimonials
 */

import {
  Hero,
  Benefits,
  HowItWorks,
  Testimonials,
  Pricing,
  FAQ,
  CTAFooter,
} from "@/components/pilot";

export default function PilotLandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <Hero />

      {/* Benefits Section */}
      <section id="benefits">
        <Benefits />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* Social Proof Section */}
      <Testimonials />

      {/* Pricing Section */}
      <section id="pricing">
        <Pricing />
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <FAQ />
      </section>

      {/* Final CTA Section */}
      <CTAFooter />

      {/* TODO: Add sticky CTA bar on mobile scroll */}
      {/* TODO: Add exit-intent popup for hesitant visitors */}
      {/* TODO: Integrate with Supabase for waitlist capture */}
    </div>
  );
}
