'use client';

import { motion } from 'framer-motion';

/**
 * ============================================================
 * SUCCESS CONFIRMATION COMPONENT
 * ============================================================
 * UX Rules Applied:
 * - Hero kerning +75
 * - Body line-height 150–160%
 * - Colors: matte black #0A0A0A, warm ivory #F5F3F0, gold accent #C5A572, teal highlight #2DD4BF
 */

interface SuccessConfirmationProps {
  title?: string;
  message?: string;
  nextSteps?: string[];
}

export default function SuccessConfirmation({
  title = "You're in!",
  message = "Welcome to the Synqra Founder Pilot. Check your email for next steps.",
  nextSteps = [
    "Check your inbox for a welcome email (arrives within 5 minutes)",
    "Join our private Slack channel for pilots",
    "Schedule your 1:1 onboarding call with our team",
  ],
}: SuccessConfirmationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0A0A0A' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(197, 165, 114, 0.15)' }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-4"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 600,
            letterSpacing: '0.075em',
            color: '#F5F3F0',
            lineHeight: 1.1,
          }}
        >
          {title}
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-12"
          style={{
            fontSize: '1.125rem',
            lineHeight: '160%',
            color: 'rgba(245, 243, 240, 0.7)',
            maxWidth: '600px',
            margin: '0 auto 3rem',
          }}
        >
          {message}
        </motion.p>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl p-8"
          style={{
            backgroundColor: 'rgba(245, 243, 240, 0.03)',
            border: '1px solid rgba(245, 243, 240, 0.1)',
          }}
        >
          <h2
            className="mb-6"
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#C5A572',
            }}
          >
            What Happens Next
          </h2>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)' }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#2DD4BF',
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: '150%',
                    color: '#F5F3F0',
                  }}
                >
                  {step}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-center"
        >
          <a
            href="/"
            className="inline-block px-8 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-98"
            style={{
              height: '48px',
              padding: '16px 32px',
              backgroundColor: '#C5A572',
              color: '#0A0A0A',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.025em',
              textTransform: 'uppercase',
              lineHeight: '48px',
            }}
          >
            Back to Home
          </a>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
          style={{
            fontSize: '0.75rem',
            color: 'rgba(245, 243, 240, 0.4)',
            letterSpacing: '0.05em',
          }}
        >
          <p>Synqra</p>
          <p className="mt-1 italic">"Drive Unseen. Earn Smart."</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
