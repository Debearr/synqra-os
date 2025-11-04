import { type DashboardPreviewMetrics } from '@/lib/supabase';

type MetricsShowcaseProps = {
  metrics: DashboardPreviewMetrics;
};

const metricCards: Array<{
  key: keyof DashboardPreviewMetrics;
  label: string;
  suffix?: string;
  description: string;
}> = [
  {
    key: 'liveUsers',
    label: 'Live executives',
    description: 'Verified leaders managed by Synqra today.',
  },
  {
    key: 'automationsTriggered',
    label: 'Automations triggered',
    description: 'Total concierge workflows executed this quarter.',
  },
  {
    key: 'activeAutomations',
    label: 'Active rituals',
    description: 'Maison and Couture tier programs running now.',
  },
  {
    key: 'scheduledContent',
    label: 'Stories in motion',
    description: 'Strategic posts prepared for the next 30 days.',
  },
  {
    key: 'averageEngagementRate',
    label: 'Avg. engagement lift',
    suffix: '%',
    description: 'AuraFX measured uplift versus baseline content.',
  },
];

export function MetricsShowcase({ metrics }: MetricsShowcaseProps) {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <div className="grid gap-6 rounded-3xl border border-white/5 bg-noid-charcoal/60 p-10 shadow-inner backdrop-blur md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-noid-gray/80">Dashboard preview</span>
          <h2 className="text-3xl font-semibold text-noid-white sm:text-4xl">Metrics that greet you on login.</h2>
          <p className="text-sm text-noid-gray/80">
            When a Synqra client signs in, they arrive to a concierge brief. These are the live tiles powered by Supabase data and AuraFX intelligence.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {metricCards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-white/5 bg-noid-charcoal-light/70 p-6 transition-transform duration-500 hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-wide text-noid-gray/70">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-noid-white">
                {metrics[card.key].toLocaleString()} {card.suffix}
              </p>
              <p className="mt-2 text-xs text-noid-gray/60">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
