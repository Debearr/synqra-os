'use client';

import React, { useEffect, useState } from 'react';

const CopyCarousel = ({ lines = [], format = 'square' }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % lines.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + lines.length) % lines.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lines.length]);

  const aspectClass = format === 'wide' ? 'aspect-[16/9] max-w-[1600px]' : 'aspect-square max-w-[1200px]';

  return (
    <div className={`relative w-full ${aspectClass} bg-[#0A0A0A] overflow-hidden shadow-2xl rounded-xl`}>
      <div className="absolute inset-0 p-10 md:p-16 flex items-center justify-center">
        <p
          className="text-center text-white leading-tight"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 600,
            fontSize: format === 'wide' ? '56px' : '48px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {lines[index] || ''}
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button
          onClick={() => setIndex((i) => (i - 1 + lines.length) % lines.length)}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Prev
        </button>
        <div className="inline-flex items-center gap-2">
          {lines.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full ${i === index ? 'bg-[#D4AF37] w-6 h-2' : 'bg-zinc-600 w-2 h-2'}`}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => (i + 1) % lines.length)}
          className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg hover:bg-[#B8941F] transition-colors font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CopyCarousel;
