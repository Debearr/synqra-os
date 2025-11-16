import Link from 'next/link';

export function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-noid-charcoal/70 via-transparent to-noid-black" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-[1fr_0.6fr] md:py-32">
        <div className="flex flex-col gap-6">
          <span className="inline-flex max-w-fit items-center gap-2 rounded-full border border-noid-gray/40 px-4 py-1 text-xs tracking-[0.3em] uppercase text-noid-gray/90">
            Luxury automation suite
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-noid-white sm:text-5xl lg:text-6xl">
            Guide every social moment with concierge precision.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-noid-gray sm:text-lg">
            Synqra orchestrates your executive social presence end-to-end—predictive scheduling,
            brand-consistent storytelling, and AuraFX intelligence in one motion-smooth dashboard.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="#waitlist"
              className="rounded-full bg-noid-gold px-6 py-3 text-sm font-semibold text-noid-black transition-transform duration-500 hover:-translate-y-0.5 hover:shadow-gold-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-gold/50"
            >
              Join the waitlist
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-noid-teal/40 px-6 py-3 text-sm font-semibold text-noid-teal transition-all duration-500 hover:border-noid-teal hover:bg-noid-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/50"
            >
              Preview the dashboard
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 -translate-x-10 rounded-full bg-gradient-teal blur-3xl" aria-hidden="true" />
          <div className="relative flex w-full max-w-md flex-col gap-4 rounded-3xl border border-white/5 bg-noid-charcoal/60 p-8 shadow-teal-glow backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noid-gray/80">Live status</p>
              <p className="mt-2 text-2xl font-semibold text-noid-white">AuraFX signal sync</p>
              <p className="mt-1 text-sm text-noid-gray/80">4.2s pipeline latency</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/5 bg-noid-charcoal-light/70 p-4">
                <p className="text-xs uppercase tracking-wide text-noid-gray/70">Priority feeds</p>
                <p className="mt-1 text-2xl font-semibold text-noid-white">LinkedIn</p>
                <p className="text-xs text-noid-gray/60">Executive concierge</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-noid-charcoal-light/70 p-4">
                <p className="text-xs uppercase tracking-wide text-noid-gray/70">Tone guard</p>
                <p className="mt-1 text-2xl font-semibold text-noid-white">99.2%</p>
                <p className="text-xs text-noid-gray/60">Brand alignment</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-noid-charcoal-light/70 p-4">
                <p className="text-xs uppercase tracking-wide text-noid-gray/70">Automations</p>
                <p className="mt-1 text-2xl font-semibold text-noid-white">Active 46</p>
                <p className="text-xs text-noid-gray/60">Maison + Couture</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-noid-charcoal-light/70 p-4">
                <p className="text-xs uppercase tracking-wide text-noid-gray/70">AuraFX insights</p>
                <p className="mt-1 text-2xl font-semibold text-noid-white">Real-time</p>
                <p className="text-xs text-noid-gray/60">Every channel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
