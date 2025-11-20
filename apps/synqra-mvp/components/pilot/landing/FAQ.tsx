"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/pilot";
import { cn } from "@/lib/utils";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent via-brand-ink to-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="caption text-brand-teal mb-4 block">
            Frequently Asked Questions
          </span>
          <h2 className="h-h1 font-bold text-brand-fg mb-4">
            Everything You Need to Know
          </h2>
          <p className="body-lg text-brand-gray max-w-2xl mx-auto">
            Still have questions? Email us at{" "}
            <a href="mailto:pilot@synqra.app" className="text-brand-teal hover:underline">
              pilot@synqra.app
            </a>
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm hover:border-brand-teal/40 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-lg font-semibold text-brand-fg pr-8">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-brand-teal transition-transform flex-shrink-0",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="px-6 pb-6 text-brand-gray leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
