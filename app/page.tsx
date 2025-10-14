export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b0b0f] text-[#eaeaf2] flex items-center justify-center p-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Synqra OS</h1>
        <p className="mt-4 text-lg md:text-xl text-[#9aa0b4]">
          One input → many outputs. Automate the chaos; keep the craft.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a className="rounded-md border border-white/10 px-4 py-3 hover:bg-white/5 transition" href="/chaos-copy">Chaos Copy</a>
          <a className="rounded-md border border-white/10 px-4 py-3 hover:bg-white/5 transition" href="/launch-plan">Launch Plan</a>
          <a className="rounded-md border border-white/10 px-4 py-3 hover:bg-white/5 transition" href="/dual-preview">Dual Preview</a>
        </div>
      </div>
    </main>
  );
}
