'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSuccess(true);
      
      // If email confirmation is disabled, redirect immediately
      if (data.session) {
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl"
        />
      </div>

      {/* Signup Card */}
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
            Create Account
          </h2>
          <p className="text-silver-mist/60 mb-6">
            Join Synqra OS and start automating
          </p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-lg bg-teal-neon/10 border border-teal-neon/30 text-center"
            >
              <div className="text-5xl mb-4">✓</div>
              <p className="text-teal-neon text-lg font-medium mb-2">
                Account Created Successfully!
              </p>
              <p className="text-silver-mist/60 text-sm">
                Check your email to confirm your account, or redirecting you to dashboard...
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

              {/* Signup Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-body font-medium text-silver-mist mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-deep-charcoal border border-white/10 text-silver-mist placeholder-silver-mist/40 focus:outline-none focus:border-teal-neon transition-colors"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>

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
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg bg-deep-charcoal border border-white/10 text-silver-mist placeholder-silver-mist/40 focus:outline-none focus:border-teal-neon transition-colors"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-silver-mist/40">
                    Must be at least 6 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-gold to-rose-gold text-matte-black font-body font-semibold hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              {/* Terms */}
              <p className="mt-4 text-xs text-center text-silver-mist/40">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-silver-mist/60">Already have an account? </span>
            <Link
              href="/auth/login"
              className="text-teal-neon hover:text-teal-neon/80 transition-colors font-medium"
            >
              Sign in
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
