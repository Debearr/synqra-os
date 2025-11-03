'use client';

import React, { useEffect, useState } from 'react';
import { SystemMetric } from '@/app/types/dashboard';

interface LumenMetricsProps {
  initialMetrics?: SystemMetric[];
}

export default function LumenMetrics({ initialMetrics }: LumenMetricsProps) {
  const [metrics, setMetrics] = useState<SystemMetric[]>(
    initialMetrics || [
      {
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        trend: 'down',
        history: [52, 48, 50, 47, 45],
      },
      {
        name: 'Memory',
        value: 68,
        unit: '%',
        trend: 'stable',
        history: [65, 67, 68, 67, 68],
      },
      {
        name: 'Network I/O',
        value: 2.4,
        unit: 'GB/s',
        trend: 'up',
        history: [1.8, 2.0, 2.2, 2.3, 2.4],
      },
      {
        name: 'Active Processes',
        value: 156,
        unit: '',
        trend: 'up',
        history: [142, 148, 151, 154, 156],
      },
    ]
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→',
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-blue-400',
  };

  const MiniChart = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 30;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="ml-auto">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-purple-400"
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 border border-purple-500/30 animate-pulse">
        <div className="h-6 bg-purple-500/20 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-purple-500/20 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-purple-300">Lumen Metrics</h2>
        <div className="text-xs text-gray-400">Real-time</div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-black/30 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm text-gray-400 mb-1">{metric.name}</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">
                    {typeof metric.value === 'number' && metric.value % 1 !== 0
                      ? metric.value.toFixed(1)
                      : metric.value}
                  </span>
                  <span className="text-sm text-gray-400">{metric.unit}</span>
                  <span className={`text-lg ${trendColors[metric.trend]}`}>
                    {trendIcons[metric.trend]}
                  </span>
                </div>
              </div>
              <MiniChart data={metric.history} />
            </div>

            {/* Progress Bar */}
            {metric.unit === '%' && (
              <div className="mt-3">
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.value < 50
                        ? 'bg-green-400'
                        : metric.value < 75
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Overall Performance</span>
          <span className="text-sm font-semibold text-green-400">Optimal</span>
        </div>
      </div>
    </div>
  );
}
