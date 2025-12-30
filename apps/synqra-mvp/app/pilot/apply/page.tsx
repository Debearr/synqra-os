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
      className="min-h-screen relative"
      style={{
        backgroundColor: '#0A0A0A',
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(197, 165, 114, 0.08), transparent 50%), radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.06), transparent 50%)',
      }}
    >
      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 rounded-full mb-6"
            style={{
              backgroundColor: 'rgba(45, 212, 191, 0.1)',
              border: '1px solid rgba(45, 212, 191, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#2DD4BF',
              }}
            >
              Founder Pilot • Limited to 50 Seats
            </span>
          </motion.div>

          {/* Title */}
          <h1
            className="mb-6"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 600,
              letterSpacing: '0.075em',
              color: '#F5F3F0',
              lineHeight: 1.1,
            }}
          >
            Join the Synqra Pilot
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto max-w-2xl"
            style={{
              fontSize: '1.125rem',
              lineHeight: '160%',
              color: 'rgba(245, 243, 240, 0.7)',
            }}
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
          className="mb-12 grid gap-4 md:grid-cols-3"
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
              className="p-6 rounded-xl text-center"
              style={{
                backgroundColor: 'rgba(245, 243, 240, 0.02)',
                border: '1px solid rgba(245, 243, 240, 0.08)',
              }}
            >
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h3
                className="mb-2"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#C5A572',
                }}
              >
                {benefit.title}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  lineHeight: '150%',
                  color: 'rgba(245, 243, 240, 0.6)',
                }}
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
            style={{
              fontSize: '0.875rem',
              lineHeight: '150%',
              color: 'rgba(245, 243, 240, 0.5)',
            }}
          >
            Applications are reviewed within 48 hours.{' '}
            <span style={{ color: '#C5A572' }}>Questions?</span>{' '}
            Email us at{' '}
            <a
              href="mailto:pilot@synqra.com"
              style={{
                color: '#2DD4BF',
                textDecoration: 'underline',
              }}
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
          className="mt-16 text-center"
          style={{
            fontSize: '0.75rem',
            color: 'rgba(245, 243, 240, 0.3)',
            letterSpacing: '0.05em',
          }}
        >
          <p>SYNQRA</p>
        </motion.div>
      </div>
    </main>
  );
}
