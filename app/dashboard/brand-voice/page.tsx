import { sampleBrandVoice } from '@/lib/placeholderData';

export default function BrandVoice() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Brand Voice</h1>
        <p className="text-softGray mt-2">Define and maintain your brand identity</p>
      </header>

      <div className="grid gap-6">
        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Tone & Style</h2>
          <p className="text-softGray leading-relaxed">{sampleBrandVoice.tone}</p>
          <button className="mt-4 px-6 py-2 bg-goldFoil text-midnightBlack font-medium rounded-lg hover:bg-goldFoil/90 transition-all">
            Edit Tone
          </button>
        </div>

        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Brand Keywords</h2>
          <p className="text-softGray mb-4">Words that represent your brand</p>
          <div className="flex flex-wrap gap-2">
            {sampleBrandVoice.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-4 py-2 bg-neonTeal/10 text-neonTeal rounded-full border border-neonTeal/30"
              >
                {keyword}
              </span>
            ))}
          </div>
          <button className="mt-4 px-6 py-2 bg-transparent border border-neonTeal text-neonTeal font-medium rounded-lg hover:bg-neonTeal/10 transition-all">
            Add Keywords
          </button>
        </div>

        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Words to Avoid</h2>
          <p className="text-softGray mb-4">Terms that don't align with your brand</p>
          <div className="flex flex-wrap gap-2">
            {sampleBrandVoice.avoidWords.map((word) => (
              <span
                key={word}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-full border border-red-500/30"
              >
                {word}
              </span>
            ))}
          </div>
          <button className="mt-4 px-6 py-2 bg-transparent border border-red-400 text-red-400 font-medium rounded-lg hover:bg-red-500/10 transition-all">
            Manage Exclusions
          </button>
        </div>
      </div>
    </div>
  );
}
