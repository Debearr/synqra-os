'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-midnightBlack">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-3xl font-bold text-goldFoil font-playfair">Something went wrong</h2>
        <p className="text-softGray">
          {error.message || 'An unexpected error occurred in the dashboard'}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-goldFoil text-midnightBlack font-medium rounded-lg hover:bg-goldFoil/90 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-transparent border border-neonTeal text-neonTeal font-medium rounded-lg hover:bg-neonTeal/10 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
