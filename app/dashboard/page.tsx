import { sampleMetrics } from '@/lib/placeholderData';

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Dashboard Overview</h1>
        <p className="text-softGray mt-2">Welcome to your Synqra command center</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sampleMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-midnightBlack border border-softGray/20 rounded-lg p-6 hover:border-neonTeal/50 transition-all"
          >
            <p className="text-softGray text-sm uppercase tracking-wide">{metric.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
            <div className="flex items-center mt-3">
              <span
                className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-neonTeal' : 'text-red-400'
                }`}
              >
                {metric.change}
              </span>
              <span className="ml-2">{metric.trend === 'up' ? '↑' : '↓'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-goldFoil font-playfair mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-midnightBlack border border-neonTeal/20 rounded">
            <span className="text-white">New post published to Instagram</span>
            <span className="text-softGray text-sm">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-midnightBlack border border-goldFoil/20 rounded">
            <span className="text-white">Campaign analytics updated</span>
            <span className="text-softGray text-sm">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-midnightBlack border border-neonTeal/20 rounded">
            <span className="text-white">3 posts scheduled for tomorrow</span>
            <span className="text-softGray text-sm">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
