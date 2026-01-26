'use client';

import { motion } from 'framer-motion';
import PilotApplicationForm from '@/components/forms/PilotApplicationForm';

/**
 * ============================================================
 * SYNQRA PILOT APPLICATION PAGE
 * ============================================================
 * Phase 2 Build - Founder Pilot Application Flow
 * 
 * UX Rules Applied:
 * - Hero kerning +75
 * - Body line-height 150–160%
 * - Colors: matte black #0A0A0A, warm ivory #F5F3F0, gold accent #C5A572, teal highlight #2DD4BF
 */

export default function PilotApplyPage() {
  return (
    <main
      className="min-h-screen relative bg-[#0A0A0A] bg-[radial-gradient(circle_at_20%_20%,rgba(197,165,114,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(45,212,191,0.06),transparent_50%)]"
    >
      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24 space-y-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center px-5 py-2 rounded-full mb-8 luxury-hover-lift bg-[#F5F3F0]/[0.03] border border-[#C5A572]/20 shadow-[0_0_20px_-10px_rgba(197,165,114,0.3)]"
          >
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C5A572]">
              Founder Pilot • Limited to 50 Seats
            </span>
          </motion.div>

          {/* Title */}
          <h1
            className="mb-6 font-display text-[clamp(3rem,6vw,5rem)] font-medium tracking-tight text-[#F5F3F0] leading-[1.05] drop-shadow-[0_0_40px_rgba(245,243,240,0.1)]"
          >
            Join the Synqra Pilot
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto max-w-2xl font-light text-xl leading-[1.6] text-[#F5F3F0]/60"
          >
            Get early access to Synqra's executive content engine. Shape the product,
            enjoy founder perks, and unlock your executive voice in 90 seconds.
          </p>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: '⚡',
              title: 'Early Access',
              description: 'Be first to experience the full platform',
            },
            {
              icon: '💎',
              title: 'Founder Pricing',
              description: 'Lock in exclusive lifetime rates',
            },
            {
              icon: '🎯',
              title: 'Direct Influence',
              description: 'Shape features with our product team',
            },
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-8 rounded-2xl text-center group hover:bg-white/[0.02] transition-colors duration-500 border border-[#F5F3F0]/[0.06]"
            >
              <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">{benefit.icon}</div>
              <h3
                className="mb-2 font-display text-sm font-semibold tracking-[0.1em] uppercase text-[#C5A572]"
              >
                {benefit.title}
              </h3>
              <p
                className="text-sm leading-[160%] text-[#F5F3F0]/50"
              >
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Application Form */}
        <PilotApplicationForm />

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p
            className="text-sm leading-[150%] text-[#F5F3F0]/50"
          >
            Applications are reviewed within 48 hours.{' '}
            <span className="text-[#C5A572]">Questions?</span>{' '}
            Email us at{' '}
            <a
              href="mailto:pilot@synqra.com"
              className="text-[#2DD4BF] underline"
            >
              pilot@synqra.com
            </a>
          </p>
        </motion.div>

        {/* Bottom Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center text-xs text-[#F5F3F0]/30 tracking-[0.05em]"
        >
          <p>SYNQRA</p>
        </motion.div>
      </div>
    </main>
  );
}
