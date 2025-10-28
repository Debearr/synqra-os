import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-midnightBlack">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">🔍</div>
        <h2 className="text-3xl font-bold text-goldFoil font-playfair">Page Not Found</h2>
        <p className="text-softGray">
          The dashboard page you're looking for doesn't exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-goldFoil text-midnightBlack font-medium rounded-lg hover:bg-goldFoil/90 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
