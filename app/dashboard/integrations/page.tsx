import { sampleIntegrations } from '@/lib/placeholderData';

export default function Integrations() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Integrations</h1>
        <p className="text-softGray mt-2">Connect your social platforms</p>
      </header>

      <div className="grid gap-4">
        {sampleIntegrations.map((integration) => (
          <div
            key={integration.name}
            className="bg-midnightBlack border border-softGray/20 rounded-lg p-6 hover:border-neonTeal/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{integration.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                  <p className="text-softGray mt-1">{integration.description}</p>
                </div>
              </div>
              <button
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  integration.status === 'connected'
                    ? 'bg-neonTeal/20 text-neonTeal border border-neonTeal/30 hover:bg-neonTeal/30'
                    : 'bg-goldFoil text-midnightBlack hover:bg-goldFoil/90'
                }`}
              >
                {integration.status === 'connected' ? 'Connected ✓' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-midnightBlack border border-goldFoil/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-goldFoil font-playfair mb-2">Need Another Platform?</h2>
        <p className="text-softGray mb-4">Request integration support for additional platforms</p>
        <button className="px-6 py-2 bg-transparent border border-goldFoil text-goldFoil font-medium rounded-lg hover:bg-goldFoil/10 transition-all">
          Request Integration
        </button>
      </div>
    </div>
  );
}
