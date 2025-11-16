'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

/**
 * ============================================================
 * SYNQRA SIGN IN PAGE
 * ============================================================
 * Production-grade authentication with:
 * - Email/password login
 * - Magic link option
 * - Social auth (Google, GitHub)
 * - Error handling
 * - Brand consistency
 */

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  // Email/Password Sign In
  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/agents');
        router.refresh();
      }
    } catch (err: any) {
      console.error('[SignIn] Error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  // Magic Link Sign In
  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
    } catch (err: any) {
      console.error('[SignIn] Magic link error:', err);
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  }

  // Social Auth
  async function handleSocialSignIn(provider: 'google' | 'github') {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('[SignIn] Social auth error:', err);
      setError(err.message || 'Failed to sign in with ' + provider);
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="inline-block w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Check your email</h1>
            <p className="text-zinc-400 text-sm">
              We've sent a magic link to <span className="text-white font-medium">{email}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setUseMagicLink(false);
            }}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-xl font-semibold tracking-tight">Synqra</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-zinc-400 text-sm">
            Sign in to your Synqra account
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
          {/* Social Sign In */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocialSignIn('google')}
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 
                         text-white hover:bg-zinc-800 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleSocialSignIn('github')}
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 
                         text-white hover:bg-zinc-800 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
            </div>
          </div>

          {/* Email/Password or Magic Link */}
          <form onSubmit={useMagicLink ? handleMagicLink : handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 
                           text-white placeholder:text-zinc-600
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                           transition-all duration-200 disabled:opacity-50"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {!useMagicLink && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 
                             text-white placeholder:text-zinc-600
                             focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                             transition-all duration-200 disabled:opacity-50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div 
                className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || (!useMagicLink && !password)}
              className="w-full rounded-xl bg-emerald-400 text-black font-semibold py-3.5
                         hover:bg-emerald-300 active:bg-emerald-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none" 
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    />
                  </svg>
                  {useMagicLink ? 'Sending...' : 'Signing in...'}
                </span>
              ) : (
                useMagicLink ? 'Send magic link' : 'Sign in'
              )}
            </button>

            {/* Toggle Magic Link */}
            <button
              type="button"
              onClick={() => setUseMagicLink(!useMagicLink)}
              className="w-full text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {useMagicLink ? 'Use password instead' : 'Use magic link instead'}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link href="/waitlist" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Join the waitlist
            </Link>
          </p>
          <p className="text-xs text-zinc-600">
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
