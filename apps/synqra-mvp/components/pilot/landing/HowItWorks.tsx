import { ArrowRight } from "lucide-react";
import { HOW_IT_WORKS } from "@/lib/pilot";

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent via-brand-ink to-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="caption text-brand-gold mb-4 block">
            Simple Process
          </span>
          <h2 className="h-h1 font-bold text-brand-fg mb-4">
            From Application to Results in 7 Days
          </h2>
          <p className="body-lg text-brand-gray max-w-2xl mx-auto">
            No complicated setup. No learning curve. Just results.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connection Lines (desktop only) */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-teal via-brand-gold to-brand-teal opacity-20" />

          {HOW_IT_WORKS.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Number Badge */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center text-2xl font-bold text-noir mb-6 relative z-10">
                {step.step}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-brand-fg mb-4">
                {step.title}
              </h3>
              <p className="text-brand-gray leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Arrow indicator */}
              {index < HOW_IT_WORKS.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-6 -right-8 w-6 h-6 text-brand-teal/40" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-brand-gray mb-4">
            Ready to see what Synqra can do for your business?
          </p>
          <div className="inline-flex items-center gap-2 text-brand-teal font-semibold hover:gap-3 transition-all cursor-pointer">
            Start Your Test Drive
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
