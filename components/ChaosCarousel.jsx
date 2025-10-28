'use client';

import React, { useState } from 'react';

const ChaosCarousel = ({ format = "square" }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      headline: "The chaos is real.",
      bullets: [
        "4 AI tools, broken PDFs, endless reformatting",
        "Burnout + wasted focus = lost revenue"
      ]
    },
    {
      id: 2,
      headline: "I spent 6 hours making one newsletter.",
      subhead: "This is the $300/hour Chaos Tax every founder pays."
    },
    {
      id: 3,
      headline: "Synqra ends the Chaos Tax.",
      bullets: [
        "One input → 8 outputs",
        "Luxury tone, zero friction",
        "From $20K agency chaos = $499 clarity"
      ],
      cta: "Stop paying the Chaos Tax. Start scaling."
    }
  ];

  const aspectClass =
    format === "wide" ? "aspect-[16/9] max-w-[1600px]" : "aspect-square max-w-[1200px]";
  const exportSize =
    format === "wide" ? "1600×900px (Twitter/X)" : "1200×1200px (LinkedIn/IG)";

  return (
    <div className="min-h-screen bg-zinc-900 p-8 flex flex-col items-center justify-center">
      <div className="mb-8 flex gap-4">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === idx ? 'bg-cyan-500 w-8' : 'bg-zinc-600'
            }`}
          />
        ))}
      </div>

      <div className={`relative w-full ${aspectClass} bg-[#0A0A0A] overflow-hidden shadow-2xl`}>
        <div className="absolute bottom-8 right-8 flex gap-1 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-[#D4AF37]"
              style={{ height: `${Math.random() * 80 + 40}px` }}
            />
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-20">
          {currentSlide === 0 && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <h1
                className="text-[#D4AF37] text-center mb-24 leading-tight tracking-wide"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: format === "wide" ? '80px' : '72px',
                  fontWeight: 600,
                  textShadow: '0 2px 4px rgba(212, 175, 55, 0.3)'
                }}
              >
                The chaos is real.
              </h1>
              <div className="space-y-12 max-w-3xl">
                {slides[0].bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="text-[#00A1D6] text-3xl mt-1">◆</span>
                    <p
                      className="text-white text-2xl leading-relaxed"
                      style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSlide === 1 && (
            <div className="flex-1 flex flex-col justify-center items-center space-y-16">
              <h1
                className="text-[#D4AF37] text-center leading-tight tracking-wide max-w-5xl"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: format === "wide" ? '72px' : '60px',
                  fontWeight: 600,
                  textShadow: '0 2px 4px rgba(212, 175, 55, 0.3)'
                }}
              >
                I spent 6 hours making one newsletter.
              </h1>
              <p
                className="text-center text-3xl italic leading-relaxed max-w-3xl"
                style={{
                  fontFamily: 'Helvetica Neue, sans-serif',
                  background: 'linear-gradient(135deg, #00A1D6 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                This is the $300/hour Chaos Tax every founder pays.
              </p>
            </div>
          )}

          {currentSlide === 2 && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex-1 flex flex-col justify-center items-center">
                <h1
                  className="text-[#D4AF37] text-center mb-20 leading-tight tracking-wide"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: format === "wide" ? '80px' : '72px',
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  Synqra ends the Chaos Tax.
                </h1>
                <div className="space-y-10 max-w-3xl mb-16">
                  {slides[2].bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <span className="text-[#00A1D6] text-2xl mt-1">→</span>
                      <p
                        className="text-white text-2xl leading-relaxed"
                        style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
                      >
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mb-8">
                <p
                  className="text-[#D4AF37] font-bold text-3xl"
                  style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
                >
                  {slides[2].cta}
                </p>
              </div>
            </div>
          )}

          <div className="absolute bottom-8 right-20">
            <p
              className="text-[#D4AF37] text-xl tracking-wider"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              De Bear × 🧸
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-6 py-3 bg-zinc-800 text-white rounded-lg disabled:opacity-30 hover:bg-zinc-700 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          className="px-6 py-3 bg-[#D4AF37] text-black rounded-lg disabled:opacity-30 hover:bg-[#B8941F] transition-colors font-semibold"
        >
          Next
        </button>
      </div>

      <div className="mt-12 p-6 bg-zinc-800 rounded-lg max-w-2xl">
        <h3 className="text-white text-lg font-semibold mb-3">📤 Export Instructions:</h3>
        <ol className="text-zinc-300 space-y-2 text-sm">
          <li>1. Use browser screenshot tools to capture each slide at {exportSize}</li>
          <li>2. Or use print-to-PDF with custom dimensions set to {exportSize}</li>
          <li>3. LinkedIn/IG: Upload square set; Twitter/X: Upload wide set</li>
          <li>4. Recommended: Use Canva/Figma for 300 DPI exports</li>
        </ol>
      </div>
    </div>
  );
};

export default ChaosCarousel;
