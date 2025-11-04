import { Clock, Sparkles, Workflow } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AuraFX intelligence',
    description: 'Adaptive tone modeling and executive voice blending keep every post on-brand.',
  },
  {
    icon: Workflow,
    title: 'Concierge automations',
    description: 'Maison to Couture tier workflows coordinate content, approvals, and publishing.',
  },
  {
    icon: Clock,
    title: 'Predictive scheduling',
    description: 'Surface the exact moment to release announcements across channels with seconds-level precision.',
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6" id="capabilities">
      <div className="grid gap-8 rounded-3xl border border-white/5 bg-noid-charcoal/60 p-10 backdrop-blur md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col gap-4">
            <feature.icon className="h-10 w-10 text-noid-teal" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-noid-white">{feature.title}</h3>
            <p className="text-sm text-noid-gray/80">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
