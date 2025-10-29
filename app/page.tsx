import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold gradient-gold">Synqra OS</h1>
        <p className="mt-4 text-base md:text-lg text-silver-mist/80">
          Luxury automation with street‑premium aesthetics. Seamless. Powerful. Yours.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md border border-gold transition-transform duration-300 hover:glow-gold active:scale-95"
          >
            Enter Dashboard
          </Link>
          <Link href="/launch-plan" className="px-6 py-3 rounded-md bg-deep-charcoal hover:bg-black/30 transition">
            Launch Plan
          </Link>
        </div>
      </div>
    </main>
  );
}
