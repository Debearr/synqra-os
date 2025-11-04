import Link from 'next/link';

const continuityItems = [
  {
    title: 'NØID Studio',
    description: 'Brand intelligence hub sets the guardrails for every Synqra automation.',
    href: 'https://noid.so',
  },
  {
    title: 'Synqra Dashboard',
    description: 'Operational nerve center, orchestrating copy, cadence, and concierge approvals.',
    href: '/dashboard',
  },
  {
    title: 'AuraFX Intelligence',
    description: 'Predictive tone engine monitors sentiment and optimizes release windows in real time.',
    href: 'https://aurafx.ai',
  },
];

export function ContinuitySection() {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6" id="continuity">
      <div className="grid gap-10 rounded-3xl border border-white/5 bg-noid-charcoal/60 p-10 backdrop-blur md:grid-cols-[0.65fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-noid-gray/80">Continuity</span>
          <h2 className="text-3xl font-semibold text-noid-white sm:text-4xl">
            One click, entire ecosystem.
          </h2>
          <p className="text-sm text-noid-gray/80">
            Move through NØID, Synqra, and AuraFX as a single surface. Identity, automations, and insights stay perfectly in sync.
          </p>
        </div>

        <div className="grid gap-4">
          {continuityItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col gap-2 rounded-2xl border border-white/5 bg-noid-charcoal-light/70 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-noid-teal"
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-noid-white">{item.title}</p>
                <span className="text-sm text-noid-teal transition-transform duration-500 group-hover:translate-x-1">→</span>
              </div>
              <p className="text-sm text-noid-gray/70">{item.description}</p>
              <p className="text-xs uppercase tracking-wide text-noid-gray/60">Unified auth · Seamless routing</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
