'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-matte-black via-deep-charcoal to-matte-black relative overflow-hidden p-6">
      {/* Background Effects */}
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
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-neon/10 rounded-full blur-3xl"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-5xl font-heading font-bold gradient-gold mb-2 cursor-pointer hover:opacity-80 transition-opacity">
              NØID
            </h1>
          </Link>
          <p className="text-silver-mist/60">Synqra OS</p>
        </div>

        {/* Card */}
        <div className="glassmorphism rounded-lg p-8 border border-white/10">
          <h2 className="text-2xl font-heading font-bold text-silver-mist mb-2">
            Welcome Back
          </h2>
          <p className="text-silver-mist/60 mb-6">
            Sign in to your account to continue
          </p>

          {magicLinkSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-teal-neon/10 border border-teal-neon/30"
            >
              <p className="text-teal-neon text-center">
                ✓ Magic link sent! Check your email.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-lg bg-crimson/10 border border-crimson/30"
                >
                  <p className="text-crimson text-sm">{error}</p>
                </motion.div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-body font-medium text-silver-mist mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-deep-charcoal border border-white/10 text-silver-mist placeholder-silver-mist/40 focus:outline-none focus:border-teal-neon transition-colors"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-body font-medium text-silver-mist mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-deep-charcoal border border-white/10 text-silver-mist placeholder-silver-mist/40 focus:outline-none focus:border-teal-neon transition-colors"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-gold to-rose-gold text-matte-black font-body font-semibold hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-deep-charcoal text-silver-mist/60">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Magic Link Button */}
              <button
                onClick={handleMagicLink}
                disabled={isLoading || !email}
                className="w-full px-4 py-3 rounded-lg border border-teal-neon/30 text-teal-neon hover:bg-teal-neon/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Magic Link
              </button>
            </>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-silver-mist/60">Don't have an account? </span>
            <Link
              href="/auth/signup"
              className="text-teal-neon hover:text-teal-neon/80 transition-colors font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-silver-mist/60 hover:text-silver-mist transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
