'use client';

import { useState } from 'react';

export default function HomePage() {
  const [code, setCode] = useState('');

  const handleInitialize = () => {
    if (!code || code.length < 6) return;

    document.cookie = `synqra_auth=${code}; path=/; max-age=${60 * 60 * 24 * 30}`;
    localStorage.setItem('synqra_input', code);
    localStorage.setItem('synqra_request_id', crypto.randomUUID());

    window.location.href = '/studio';
  };

  return (
    <main className="min-h-screen bg-noid-black text-white flex items-center justify-center">
      <div className="w-full max-w-lg p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-widest text-noid-silver/60">COMMAND CENTER</div>
          <h1 className="text-2xl tracking-widest">SYNQRA</h1>
        </div>

        <div className="space-y-2">
          <label className="text-xs tracking-widest text-noid-silver/60">IDENTITY CODE</label>
          <input
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 uppercase tracking-widest text-center outline-none"
            placeholder="DEBEAR01"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <button
          onClick={handleInitialize}
          className="w-full rounded-full bg-noid-gold py-3 text-black tracking-widest text-sm"
        >
          INITIALIZE
        </button>
      </div>
    </main>
  );
}

