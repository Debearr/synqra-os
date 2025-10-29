'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-matte-black via-deep-charcoal to-matte-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-neon/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        {/* Logo / Brand Mark */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-block">
            <h1 className="text-7xl md:text-9xl font-heading font-bold gradient-gold mb-2 text-shadow-gold">
              NØID
            </h1>
            <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-3xl md:text-5xl font-accent font-bold text-silver-mist mb-4">
            Synqra OS
          </h2>
          <p className="text-xl md:text-2xl text-silver-mist/70 max-w-3xl mx-auto">
            Luxury automation that preserves your craft.
            <br />
            <span className="text-teal-neon">Self-sufficient. Consistently excellent. No friction.</span>
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
        >
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-lg bg-gradient-to-r from-gold to-rose-gold text-matte-black font-body font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-glow-gold"
          >
            Enter Dashboard →
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-lg border-2 border-teal-neon text-teal-neon font-body font-semibold text-lg hover:bg-teal-neon/10 transition-all transform hover:scale-105"
          >
            Explore Features
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
        >
          {[
            { icon: '⚡', label: 'Lightning Fast', desc: 'Optimized for speed' },
            { icon: '◆', label: 'Premium Quality', desc: 'Luxury aesthetics' },
            { icon: '◈', label: 'Self-Sufficient', desc: 'Autonomous execution' }
          ].map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              className="glassmorphism rounded-lg p-6 card-hover"
            >
              <div className="text-5xl mb-4 text-teal-neon">{feature.icon}</div>
              <h3 className="text-xl font-heading font-bold text-silver-mist mb-2">
                {feature.label}
              </h3>
              <p className="text-silver-mist/60">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 text-silver-mist/40 text-sm"
        >
          <p>Phase 2 Build • 2025 NØID • Synqra OS v2.0</p>
        </motion.div>
      </div>
    </main>
  );
}
