'use client';

import { useRef, useState, FormEvent, useEffect } from 'react';
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
  const submitTimeoutRef = useRef<number | null>(null);
  // Social proof count removed per Design Constitution

  // Client-side email validation
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
    };
  }, []);

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
    console.info('[demo] waitlist submit start');

    try {
      const controller = new AbortController();
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
      }
      submitTimeoutRef.current = window.setTimeout(() => {
        controller.abort();
      }, 8000);

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          full_name: fullName.trim() || null
        }),
        signal: controller.signal,
      });

      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      const dataRecord =
        data && typeof data === "object" ? (data as Record<string, unknown>) : null;

      if (!res.ok) {
        // Handle specific error cases
        if (dataRecord?.error === 'already_registered') {
          setError('You\'re already on the list! Check your email for updates.');
          return;
        }
        // Prefer server-provided message when available (keeps UX human-friendly)
        const errorMessage =
          (typeof dataRecord?.message === "string" && dataRecord.message) ||
          (typeof dataRecord?.error === "string" && dataRecord.error) ||
          'Something went wrong';
        throw new Error(errorMessage);
      }

      // Success - redirect to success page
      console.info('[demo] waitlist submit success');
      try {
        router.push('/waitlist/success');
      } catch {
        window.location.href = '/waitlist/success';
      }
      window.setTimeout(() => {
        if (window.location.pathname !== '/waitlist/success') {
          window.location.href = '/waitlist/success';
        }
      }, 1200);

    } catch (err: unknown) {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Unable to join waitlist. Please try again.');
        return;
      }
      // Avoid Next.js dev overlay noise for expected user-facing errors
      if (process.env.NODE_ENV !== "production") {
        console.warn('[Waitlist] Submit error:', err);
      }
      const message = err instanceof Error ? err.message : 'Unable to join waitlist. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-noid-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl uppercase tracking-[0.38em] text-white">SYNQRA</div>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="rounded-3xl border border-noid-silver/30 bg-white/[0.03] p-6 shadow-[0_24px_60px_rgba(10,10,10,0.65)] space-y-4"
        >
          <div>
            <label 
              htmlFor="name" 
              className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/55 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full rounded-2xl bg-noid-black/50 border border-white/10 px-4 py-3 
                         text-white placeholder:text-white/25
                         focus:outline-none focus:ring-2 focus:ring-noid-teal focus:border-transparent
                         transition-all duration-200 disabled:opacity-50"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div>
            <label 
              htmlFor="email" 
              className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/55 mb-2"
            >
              Email Address <span className="text-white/35">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-2xl bg-noid-black/50 border border-white/10 px-4 py-3 
                         text-white placeholder:text-white/25
                         focus:outline-none focus:ring-2 focus:ring-noid-teal focus:border-transparent
                         transition-all duration-200 disabled:opacity-50"
              placeholder="email@domain.com"
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
              className="rounded-2xl bg-white/[0.03] border border-noid-silver/30 px-4 py-3 text-sm text-white/75"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-full bg-noid-gold text-noid-black font-semibold py-3.5 uppercase tracking-[0.22em]
                       hover:opacity-95 active:opacity-90
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                       focus:outline-none focus:ring-2 focus:ring-noid-teal focus:ring-offset-2 focus:ring-offset-noid-black shadow-gold-glow"
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
                Processing…
              </span>
            ) : (
              'Request Access'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
