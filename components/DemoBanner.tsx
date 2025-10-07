export default function DemoBanner({ tier, mode }) {
  return (
    <div className="w-full bg-gradient-to-r from-black via-neutral-900 to-zinc-800 text-brandGold text-center py-2 text-sm tracking-wide border-b border-brandGold/30">
      <span>🚀 {mode} Mode • {tier} Tier • “NØID doesn’t just automate — it liberates.”</span>
    </div>
  );
}
