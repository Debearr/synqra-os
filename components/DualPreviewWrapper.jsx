import React, { useRef } from 'react';
import ChaosCarousel from './ChaosCarousel';
import html2canvas from 'html2canvas';

const DualPreviewWrapper = () => {
  const squareRef = useRef(null);
  const wideRef = useRef(null);

  const handleExport = async () => {
    if (squareRef.current) {
      const canvas = await html2canvas(squareRef.current, {
        backgroundColor: '#0A0A0A',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'chaos-carousel-square.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    if (wideRef.current) {
      const canvas = await html2canvas(wideRef.current, {
        backgroundColor: '#0A0A0A',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'chaos-carousel-wide.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-12 flex flex-col gap-12 items-center justify-center">
      <h1
        className="text-[#D4AF37] text-3xl font-bold mb-6"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Chaos Tax Carousels — Dual Export Preview
      </h1>

      <button
        onClick={handleExport}
        className="px-8 py-4 bg-[#D4AF37] text-black font-semibold rounded-lg shadow-lg hover:bg-[#B8941F] transition"
      >
        📤 Export Both as PNG
      </button>

      <div className="flex flex-wrap gap-12 justify-center items-start">
        <div className="flex flex-col items-center">
          <p className="text-white mb-4">LinkedIn / IG (1200×1200)</p>
          <div ref={squareRef} className="border-2 border-[#D4AF37] rounded-xl shadow-xl overflow-hidden">
            <ChaosCarousel format="square" />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-white mb-4">Twitter / X (1600×900)</p>
          <div ref={wideRef} className="border-2 border-[#00A1D6] rounded-xl shadow-xl overflow-hidden">
            <ChaosCarousel format="wide" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualPreviewWrapper;
