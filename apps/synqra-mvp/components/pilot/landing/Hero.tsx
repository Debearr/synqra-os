"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-ink to-brand-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(212,175,55,0.08),transparent_50%)]" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-brand-teal/10 border border-brand-teal/20">
          <span className="text-brand-teal font-semibold text-sm uppercase tracking-wider">
            Founder Pilot Program
          </span>
          <span className="text-brand-gray text-sm">$97 / 7 Days</span>
        </div>

        {/* Hero Headline */}
        <h1 className="h-hero font-bold text-brand-fg mb-6 leading-[1.1]">
          Run Your Marketing
          <br />
          <span className="text-brand-teal">On Autopilot</span>
        </h1>

        {/* Subheadline */}
        <p className="body-lg text-brand-gray max-w-3xl mx-auto mb-12">
          Synqra plans, creates, posts, and engages — automatically.
          <br />
          Get your time back. Build consistency. Create more opportunities to sell.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" variant="primary">
            Start Your 7-Day Test Drive
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline">
            See How It Works
          </Button>
        </div>

        {/* Social Proof */}
        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-brand-gray">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold border-2 border-brand-bg"
                />
              ))}
            </div>
            <span>50+ founders enrolled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-teal text-lg">★★★★★</span>
            <span>4.9/5 average rating</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-brand-teal/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-brand-teal rounded-full" />
        </div>
      </div>
    </section>
  );
}
