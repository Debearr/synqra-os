'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ============================================================
 * SYNQRA WAITLIST PAGE
 * ============================================================
 * Production-grade form with:
 * - Client-side validation
 * - Loading states
 * - Error handling (network, duplicates, validation)
 * - Accessibility (labels, ARIA, focus states)
 * - Brand consistency (matte black, emerald accent)
 */

export default function WaitlistPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  // Load waitlist count for social proof
  useEffect(() => {
    fetch('/api/waitlist')
      .then(res => res.json())
      .then(data => setWaitlistCount(data.count))
      .catch(() => setWaitlistCount(null));
  }, []);

  // Client-side email validation
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Pre-flight validation
    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          full_name: fullName.trim() || null
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases
        if (data.error === 'already_registered') {
          setError('You\'re already on the list! Check your email for updates.');
          return;
        }
        throw new Error(data.error || 'Something went wrong');
      }

      // Success - redirect to success page
      router.push('/waitlist/success');

    } catch (err: any) {
      console.error('[Waitlist] Submit error:', err);
      setError(err.message || 'Unable to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium mb-4">
            EARLY ACCESS
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            Synqra Pilot Program
          </h1>
          <p className="text-zinc-400 text-sm">
            Join the first 50. Founder Access perks + priority onboarding.
          </p>
          {waitlistCount !== null && waitlistCount > 0 && (
            <p className="text-emerald-400 text-xs mt-3 font-medium">
              {waitlistCount} {waitlistCount === 1 ? 'founder has' : 'founders have'} joined
            </p>
          )}
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
        >
          <div>
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 
                         text-white placeholder:text-zinc-600
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                         transition-all duration-200 disabled:opacity-50"
              placeholder="Leroy De Beer"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 
                         text-white placeholder:text-zinc-600
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                         transition-all duration-200 disabled:opacity-50"
              placeholder="leroy@noidlabs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

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
            disabled={loading || !email}
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
                Joining...
              </span>
            ) : (
              'Join Waitlist'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p className="font-medium">NØID × Synqra</p>
          <p className="mt-1 italic">&ldquo;Drive Unseen. Earn Smart.&rdquo;</p>
        </div>
      </div>
    </main>
  );
}
