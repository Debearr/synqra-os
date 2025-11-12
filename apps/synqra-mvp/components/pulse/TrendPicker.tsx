'use client';

import { useEffect, useState } from 'react';
import { CTAButton } from '../luxgrid';

interface Trend {
  id: string;
  topic: string;
  platform: string;
  score: number;
  rank: number;
}

interface TrendPickerProps {
  selectedTrends: string[];
  onTrendsChange: (trends: string[]) => void;
  onNext: () => void;
}

export default function TrendPicker({ selectedTrends, onTrendsChange, onNext }: TrendPickerProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const platforms = ['all', 'youtube', 'tiktok', 'x', 'linkedin', 'instagram'];

  useEffect(() => {
    fetchTrends();
  }, [selectedPlatform]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pulse/trends?platform=${selectedPlatform}`);
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    }
    setLoading(false);
  };

  const refreshTrends = async () => {
    if (selectedPlatform === 'all') return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/pulse/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedPlatform }),
      });
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Failed to refresh trends:', error);
    }
    setLoading(false);
  };

  const toggleTrend = (topic: string) => {
    if (selectedTrends.includes(topic)) {
      onTrendsChange(selectedTrends.filter(t => t !== topic));
    } else if (selectedTrends.length < 5) {
      onTrendsChange([...selectedTrends, topic]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`rounded-lg px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                selectedPlatform === platform
                  ? 'bg-brand-gold text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        <button
          onClick={refreshTrends}
          disabled={loading || selectedPlatform === 'all'}
          className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Trends Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trends.map((trend) => (
            <button
              key={trend.id}
              onClick={() => toggleTrend(trend.topic)}
              className={`rounded-xl border p-6 text-left transition-all ${
                selectedTrends.includes(trend.topic)
                  ? 'border-brand-gold bg-brand-gold/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/50">
                  {trend.platform}
                </span>
                <span className="text-xs font-bold text-brand-gold">
                  #{trend.rank}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{trend.topic}</h3>
              <div className="mt-2 text-sm text-white/60">
                Score: {trend.score}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-sm uppercase tracking-wider text-white/50">
          Selected Trends ({selectedTrends.length}/5)
        </div>
        {selectedTrends.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTrends.map((trend) => (
              <span
                key={trend}
                className="rounded-lg bg-brand-gold/20 px-3 py-1 text-sm text-brand-gold"
              >
                {trend}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-white/40">No trends selected yet</div>
        )}
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <CTAButton
          label="Generate Campaign →"
          onClick={onNext}
          disabled={selectedTrends.length === 0}
        />
      </div>
    </div>
  );
}
