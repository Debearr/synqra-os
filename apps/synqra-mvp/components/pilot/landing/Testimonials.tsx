"use client";

import { Card, CardContent } from "@/components/ui";
import { TESTIMONIALS } from "@/lib/pilot";

export function Testimonials() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="caption text-brand-teal mb-4 block">
            Success Stories
          </span>
          <h2 className="h-h1 font-bold text-brand-fg mb-4">
            Real Founders, Real Results
          </h2>
          <p className="body-lg text-brand-gray max-w-2xl mx-auto">
            See what happens when you stop doing marketing manually
            and let Synqra take over.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={index}
              className="group hover:border-brand-teal/40 transition-all duration-300"
            >
              <CardContent className="pt-6 space-y-6">
                {/* Quote */}
                <div className="relative">
                  <span className="text-6xl text-brand-teal/20 font-serif absolute -top-4 -left-2">
                    "
                  </span>
                  <p className="text-brand-fg leading-relaxed relative z-10 pt-4">
                    {testimonial.quote}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center text-noir font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-brand-fg">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-brand-gray">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TODO: Add carousel navigation for mobile */}
        {/* TODO: Add video testimonials in Phase 5 */}
      </div>
    </section>
  );
}
