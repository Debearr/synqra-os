'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'NØID Labs', href: 'https://noidlabs.com' },
  { label: 'Synqra', href: '/landing' },
  { label: 'AuraFX', href: 'https://aurafx.ai' },
  { label: 'Pricing', href: '#packages' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-noid-black/80 backdrop-blur border-b border-noid-charcoal-light/60">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-[0.3em] uppercase text-noid-white">
          Synqra
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 text-sm font-medium text-noid-gray md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors duration-500 hover:text-noid-teal focus-visible:outline-none focus-visible:text-noid-teal"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth"
            className="rounded-full border border-noid-gray/50 px-4 py-2 text-sm font-medium text-noid-gray transition-all duration-500 hover:border-noid-teal hover:text-noid-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/40"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-noid-gold px-5 py-2 text-sm font-semibold text-noid-black transition-transform duration-500 hover:-translate-y-0.5 hover:shadow-gold-glow"
          >
            Command center
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-noid-white hover:text-noid-teal transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-noid-black/95 backdrop-blur border-b border-noid-charcoal-light/60">
          <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-base font-medium text-noid-gray hover:text-noid-teal transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-noid-charcoal-light/40 flex flex-col gap-3">
              <Link
                href="/auth"
                className="text-center rounded-full border border-noid-gray/50 px-4 py-3 text-sm font-medium text-noid-gray hover:border-noid-teal hover:text-noid-teal transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="text-center rounded-full bg-noid-gold px-5 py-3 text-sm font-semibold text-noid-black hover:bg-noid-gold/90 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Command center
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
