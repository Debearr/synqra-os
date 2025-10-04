import LaunchPlan from '@/components/LaunchPlan';

const ITEMS = [
  { day: 'Day 1', title: 'Hero Post', body: 'Announcement video/carousel ("Chaos ends here").' },
  { day: 'Day 2', title: 'Teaser Thread', body: '"Chaos Tax Exposed" stats.' },
  { day: 'Day 3', title: 'Founder Confession', body: 'Raw video ("Burnout → Synqra").' },
  { day: 'Day 4', title: 'Meme Drop', body: 'Roast agencies, seed to influencers.' },
  { day: 'Day 5', title: 'Agency Contrast', body: 'Carousel/thread "$20K vs $499 clarity".' },
  { day: 'Day 6', title: 'Challenge Ignition', body: 'Chaos Tax Challenge launch.' },
  { day: 'Day 7', title: 'CTA Push', body: '"Pilot closes tonight." Countdown, FOMO.' },
];

const OBJECTIONS = [
  { objection: '"AI kills creativity"', reframe: 'AI carves the grind so luxury focus thrives.' },
  { objection: '"Luxury brands don’t need this"', reframe: 'True luxury is untouchable efficiency. Chaos is mass-market.' },
  { objection: '"Too pricey"', reframe: '$499 kills $20K agency vampires. Scale empire, not excuses.' },
];

export default function LaunchPlanPage() {
  return <LaunchPlan items={ITEMS} objections={OBJECTIONS} />;
}
