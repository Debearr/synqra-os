"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

export function PilotNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-brand-teal">SYNQRA</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#benefits"
              className="text-brand-gray hover:text-brand-fg transition-colors"
            >
              Benefits
            </Link>
            <Link
              href="#how-it-works"
              className="text-brand-gray hover:text-brand-fg transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-brand-gray hover:text-brand-fg transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-brand-gray hover:text-brand-fg transition-colors"
            >
              FAQ
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Button variant="primary" size="sm">
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
