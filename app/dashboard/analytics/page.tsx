import { sampleAnalytics } from '@/lib/placeholderData';

export default function Analytics() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Analytics</h1>
        <p className="text-softGray mt-2">Track performance across platforms</p>
      </header>

      <div className="grid gap-6">
        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-6">Platform Performance</h2>
          <div className="space-y-4">
            {sampleAnalytics.map((platform) => (
              <div
                key={platform.platform}
                className="border border-softGray/20 rounded-lg p-4 hover:border-goldFoil/50 transition-all"
              >
                <h3 className="text-lg font-bold text-white mb-4">{platform.platform}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-softGray text-sm">Engagement</p>
                    <p className="text-2xl font-bold text-neonTeal">{platform.engagement.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-softGray text-sm">Reach</p>
                    <p className="text-2xl font-bold text-goldFoil">{platform.reach.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-softGray text-sm">Clicks</p>
                    <p className="text-2xl font-bold text-white">{platform.clicks.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Engagement Trends</h2>
          <div className="h-64 flex items-center justify-center border border-neonTeal/20 rounded-lg">
            <p className="text-softGray">Chart visualization placeholder - Connect analytics service</p>
          </div>
        </div>
      </div>
    </div>
  );
}
