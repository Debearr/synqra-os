import React from 'react';

export default function LaunchPlan({ items = [], objections = [] }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6 md:px-10 py-12 flex flex-col items-center gap-12">
      <header className="w-full max-w-5xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Synqra — 7‑Day Launch Plan
        </h1>
        <p className="text-zinc-400 mt-2">Chaos ends here. Narrative compounds daily.</p>
      </header>

      <section className="w-full max-w-5xl">
        <ol className="relative border-l border-zinc-800 pl-6">
          {items.map((item, idx) => (
            <li key={idx} className="mb-10 ml-2">
              <span className="absolute -left-2.5 mt-1 h-5 w-5 rounded-full bg-[#D4AF37] shadow-[0_0_0_4px_rgba(212,175,55,0.15)]" />
              <div className="flex items-baseline gap-3">
                <span className="text-sm uppercase tracking-wider text-zinc-400">{item.day}</span>
                <h3 className="text-xl md:text-2xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {item.title}
                </h3>
              </div>
              <p className="mt-2 text-zinc-300 leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {objections.length > 0 && (
        <section className="w-full max-w-5xl">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Messaging — Objection Reframes
          </h2>
          <ul className="space-y-3">
            {objections.map((o, i) => (
              <li key={i} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/40">
                <p className="text-zinc-400 text-sm mb-1">{o.objection}</p>
                <p className="text-[#D4AF37] font-semibold">{o.reframe}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
