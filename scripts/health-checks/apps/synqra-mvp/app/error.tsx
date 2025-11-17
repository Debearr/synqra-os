'use client';

/**
 * ============================================================
 * GLOBAL ERROR BOUNDARY
 * ============================================================
 * Catches unhandled errors and prevents full app crash
 * Shows user-friendly error page instead of blank screen
 */

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en" className="bg-black">
      <body className="font-sans">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <svg 
                  className="w-8 h-8 text-red-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-zinc-400 text-sm mb-6">
                We encountered an unexpected error. Our team has been notified.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-400">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-4 bg-zinc-900 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-emerald-400 text-black font-semibold rounded-xl
                           hover:bg-emerald-300 transition-colors"
              >
                Try again
              </button>
              <a
                href="/"
                className="block w-full px-6 py-3 bg-zinc-800 text-white font-semibold rounded-xl
                           hover:bg-zinc-700 transition-colors"
              >
                Go to homepage
              </a>
            </div>

            <p className="mt-6 text-xs text-zinc-600">
              Error ID: {error.digest || 'Unknown'}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
