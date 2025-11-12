'use client';

import { useEffect, useState } from 'react';

interface ShareTrackerProps {
  campaignId?: string;
}

export default function ShareTracker({ campaignId }: ShareTrackerProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchStats();
    }
  }, [campaignId]);

  const fetchStats = async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/pulse/share?campaign_id=${campaignId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  };

  if (!campaignId) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
        <div className="text-white/50">
          No campaign selected. Please generate and schedule a campaign first.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  const viralCoefficient = stats?.viral_coefficient || 0;
  const viralStatus = viralCoefficient >= 1 
    ? '🚀 Viral!' 
    : viralCoefficient >= 0.5 
    ? '📈 Growing' 
    : '🌱 Starting';

  return (
    <div className="space-y-6">
      {/* Viral Coefficient Card */}
      <div className="rounded-xl border border-brand-gold/20 bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 p-8 text-center">
        <div className="mb-2 text-sm uppercase tracking-wider text-white/50">
          Viral Coefficient
        </div>
        <div className="mb-2 text-6xl font-bold text-brand-gold">
          {viralCoefficient.toFixed(2)}
        </div>
        <div className="text-2xl">{viralStatus}</div>
        <div className="mt-4 text-sm text-white/60">
          {viralCoefficient >= 1 
            ? 'Your content is spreading exponentially!' 
            : 'Keep sharing to reach viral growth'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-2 text-sm uppercase tracking-wider text-white/50">
            Total Shares
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.total_shares || 0}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-2 text-sm uppercase tracking-wider text-white/50">
            Conversions
          </div>
          <div className="text-3xl font-bold text-brand-gold">
            {stats?.conversions || 0}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-2 text-sm uppercase tracking-wider text-white/50">
            Conversion Rate
          </div>
          <div className="text-3xl font-bold text-brand-teal">
            {stats?.total_shares > 0 
              ? ((stats.conversions / stats.total_shares) * 100).toFixed(1) 
              : 0}%
          </div>
        </div>
      </div>

      {/* Share Link */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm uppercase tracking-wider text-white/50">
            Share Link
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(stats?.share_link || '');
              alert('Link copied to clipboard!');
            }}
            className="rounded-lg bg-brand-gold px-4 py-2 text-sm text-black hover:bg-brand-gold/90"
          >
            Copy Link
          </button>
        </div>
        <div className="rounded-lg bg-black/40 p-4">
          <code className="break-all text-sm text-brand-gold">
            {stats?.share_link}
          </code>
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-sm uppercase tracking-wider text-white/50">
          What is Viral Coefficient?
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <p>
            Viral coefficient measures how many new users each existing user brings in.
          </p>
          <p>
            <strong className="text-white">VC = Conversions / Total Shares</strong>
          </p>
          <p>
            • VC &gt; 1.0 = Exponential viral growth 🚀
          </p>
          <p>
            • VC = 0.5-1.0 = Strong organic growth 📈
          </p>
          <p>
            • VC &lt; 0.5 = Building momentum 🌱
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchStats}
          className="rounded-lg bg-white/5 px-6 py-3 text-sm uppercase tracking-wider text-white/70 hover:bg-white/10"
        >
          🔄 Refresh Stats
        </button>
      </div>
    </div>
  );
}
