import Link from 'next/link';

/**
 * ============================================================
 * WAITLIST SUCCESS PAGE
 * ============================================================
 * Post-signup confirmation with:
 * - Success state
 * - Social media CTAs
 * - Brand consistency
 */

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-400/10">
          <svg 
            className="w-8 h-8 text-emerald-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          You&rsquo;re in.
        </h1>
        <p className="text-zinc-400 mb-8">
          We&rsquo;ll email you onboarding details and Founder Access perks within 48 hours.
        </p>

        {/* CTAs */}
        <div className="space-y-3">
          <a 
            href="https://synqra.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full rounded-xl bg-emerald-400 text-black font-semibold py-3
                       hover:bg-emerald-300 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            Visit Synqra
          </a>
          
          <a 
            href="https://synqra.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full rounded-xl border border-zinc-800 text-white font-semibold py-3
                       hover:bg-zinc-900 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Open Synqra App
          </a>

          <Link
            href="/"
            className="inline-block w-full rounded-xl border border-zinc-800 text-zinc-400 font-medium py-3
                       hover:bg-zinc-900 hover:text-white transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Back to Home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-zinc-900">
          <p className="text-xs text-zinc-500">
            Synqra Intelligence Systems
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Building the future of creator automation
          </p>
        </div>
      </div>
    </main>
  );
}
