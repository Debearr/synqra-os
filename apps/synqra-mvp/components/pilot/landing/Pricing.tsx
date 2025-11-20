import { Check, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { Button } from "@/components/ui";
import { PILOT_PRICING } from "@/lib/pilot";

const INCLUDED_FEATURES = [
  "Complete content calendar planning",
  "AI-powered content creation in your voice",
  "Automatic posting to LinkedIn & Twitter",
  "Daily engagement monitoring",
  "Performance analytics dashboard",
  "Direct access to support team",
  "Cancel anytime, no commitments",
];

export function Pricing() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="caption text-brand-gold mb-4 block">
            Founder Pilot Pricing
          </span>
          <h2 className="h-h1 font-bold text-brand-fg mb-4">
            Test Drive for Just {PILOT_PRICING.displayPrice}
          </h2>
          <p className="body-lg text-brand-gray max-w-2xl mx-auto">
            Experience the full power of Synqra for 7 days. No subscriptions,
            no auto-renewal. Just pure marketing automation.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="border-2 border-brand-teal/40 shadow-2xl shadow-brand-teal/20 relative overflow-hidden">
          {/* Premium badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-teal to-brand-gold text-noir text-xs font-bold px-4 py-1 uppercase tracking-wider">
            Limited Spots
          </div>

          <CardHeader className="text-center pb-8 pt-12">
            <CardTitle className="text-5xl font-bold mb-4">
              <span className="text-brand-teal">{PILOT_PRICING.displayPrice}</span>
              <span className="text-brand-gray text-2xl ml-2">
                / {PILOT_PRICING.displayDuration}
              </span>
            </CardTitle>
            <CardDescription className="text-lg">
              Full access to the Synqra platform for one week.
              <br />
              See results before you commit.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              {INCLUDED_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-brand-teal" />
                  </div>
                  <span className="text-brand-fg">{feature}</span>
                </div>
              ))}
            </div>

            {/* Value Proposition */}
            <div className="mt-8 p-6 rounded-xl bg-brand-teal/5 border border-brand-teal/20">
              <div className="text-sm text-brand-gray mb-2">
                <span className="line-through">$497/month</span> typical agency cost
              </div>
              <div className="text-xl font-bold text-brand-teal">
                Save 80% with Synqra
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-4 pt-8">
            <Button size="lg" variant="primary" className="w-full">
              Start Your 7-Day Test Drive
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-brand-gray text-center">
              No credit card required • Results in 7 days • Cancel anytime
            </p>
          </CardFooter>
        </Card>

        {/* Money-back guarantee */}
        <div className="mt-8 text-center">
          <p className="text-brand-gray">
            <span className="text-brand-gold font-semibold">100% Satisfaction Guarantee:</span>
            {" "}If Synqra doesn't save you at least 10 hours in the first week, we'll refund your $97. No questions asked.
          </p>
        </div>

        {/* TODO: Add Stripe payment integration in Phase 3 */}
      </div>
    </section>
  );
}
