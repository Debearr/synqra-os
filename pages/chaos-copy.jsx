import CopyCarousel from '@/components/CopyCarousel';

const LINES = [
  'Luxury brands: Your 6-hour PDF nightmare ends today. Synqra: 1 input → 8 outputs. Chaos Tax? Taxed.',
  'I juggled 4 AI tools till burnout hit. Built Synqra to kill it. $499/month for the edge agencies fear.',
  'Stop the $20K agency bleed. Synqra automates luxury without the drag. Efficiency is the new black.',
  'In a world of Virgil visions and Tesla precision, why tolerate chaos? Synqra: Your brand\'s silent revolution.',
  'Founder scar: Lost weeks to inefficiency. Synqra scars back—ruthless automation for brands that scale sharp.',
  'Chaos Tax Alert: 6 hours wasted = creativity crushed. Pay $499 to Synqra. Reclaim your throne.',
  'Luxury disruptor truth: Agencies hoard your time. Synqra liberates it. One input, infinite outputs. Who\'s next?',
];

const PLATFORM_PLAN = [
  { platform: 'Twitter/X', format: 'Threads', why: 'Builds narrative momentum, encourages replies & quote-tweets' },
  { platform: 'LinkedIn', format: 'Carousels', why: 'Execs love swipe storytelling, positions Synqra as boardroom intel' },
  { platform: 'TikTok', format: 'Short-form Video', why: 'Duets + trends for Gen-Z creators; chaos-to-output FOMO' },
  { platform: 'Instagram', format: 'Reels', why: 'Visual + aspirational; Stories remix turns demos viral' },
];

const CAMPAIGNS = [
  {
    title: 'Chaos Tax Challenge',
    body: 'TikTok/IG template — users show \"chaos moment\" (desk buried in tools) + overlay hours wasted. Duet with Synqra demo. Winner = free month.'
  },
  {
    title: 'Agency vs Synqra Roast',
    body: 'Twitter/IG memes roasting $20K agencies vs $499 Synqra. \"This is Fine\" dog in agency fire → Synqra phoenix.'
  },
  {
    title: 'FOMO Founder Duet',
    body: 'TikTok template — duet your founder scar video. Callout: \"Synqra or stay scarred?\" Drives creator collabs.'
  }
];

export default function ChaosCopyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8 md:p-12 flex flex-col gap-12 items-center">
      <h1 className="text-[#D4AF37] text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
        Synqra — Copy Carousel & Distribution Plan
      </h1>

      <div className="w-full max-w-[1200px]">
        <CopyCarousel lines={LINES} format="square" />
      </div>

      <section className="w-full max-w-5xl">
        <h2 className="text-white text-2xl font-semibold mb-4">Platform Plan</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border border-zinc-800 rounded-lg overflow-hidden">
            <thead className="bg-zinc-900/60">
              <tr>
                <th className="px-4 py-3 text-zinc-300">Platform</th>
                <th className="px-4 py-3 text-zinc-300">Best Format</th>
                <th className="px-4 py-3 text-zinc-300">Why</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_PLAN.map((row) => (
                <tr key={row.platform} className="border-t border-zinc-800">
                  <td className="px-4 py-3 text-white">{row.platform}</td>
                  <td className="px-4 py-3 text-white">{row.format}</td>
                  <td className="px-4 py-3 text-zinc-300">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="w-full max-w-5xl">
        <h2 className="text-white text-2xl font-semibold mb-4">Campaign Ideas</h2>
        <ul className="space-y-4">
          {CAMPAIGNS.map((c) => (
            <li key={c.title} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/40">
              <p className="text-[#D4AF37] font-semibold mb-1">{c.title}</p>
              <p className="text-zinc-300">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
