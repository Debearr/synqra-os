import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function CTAFooter() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal/20 via-brand-gold/10 to-brand-teal/20 border border-brand-teal/30 p-12 text-center">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,198,0.1),transparent_70%)]" />
          
          <div className="relative z-10">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-teal/20 mb-8">
              <Sparkles className="w-8 h-8 text-brand-teal" />
            </div>

            {/* Headline */}
            <h2 className="h-h1 font-bold text-brand-fg mb-4">
              Ready to Run Your Marketing on Autopilot?
            </h2>

            {/* Description */}
            <p className="body-lg text-brand-gray max-w-2xl mx-auto mb-8">
              Join 50+ founders who've taken back their time and 3x'd their engagement.
              Your 7-day test drive starts today.
            </p>

            {/* CTA Button */}
            <Button size="lg" variant="primary" className="shadow-2xl shadow-brand-teal/30">
              Start Your 7-Day Test Drive
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* Small print */}
            <p className="text-sm text-brand-gray mt-6">
              $97 for 7 days • No credit card required • Cancel anytime
            </p>
          </div>
        </div>

        {/* TODO: Wire CTA buttons to /pilot/apply route in Phase 2 */}
      </div>
    </section>
  );
}
