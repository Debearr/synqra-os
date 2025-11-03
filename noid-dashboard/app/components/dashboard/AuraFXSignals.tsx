'use client';

import React, { useEffect, useState } from 'react';
import { TradingSignal } from '@/app/types/dashboard';

interface AuraFXSignalsProps {
  initialSignals?: TradingSignal[];
}

export default function AuraFXSignals({ initialSignals }: AuraFXSignalsProps) {
  const [signals, setSignals] = useState<TradingSignal[]>(
    initialSignals || [
      {
        id: '1',
        timestamp: new Date(),
        type: 'buy',
        asset: 'BTC/USD',
        confidence: 87,
        price: 43250,
        change: 2.3,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000),
        type: 'sell',
        asset: 'ETH/USD',
        confidence: 72,
        price: 2280,
        change: -1.5,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 600000),
        type: 'buy',
        asset: 'SOL/USD',
        confidence: 94,
        price: 98.5,
        change: 5.2,
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 900000),
        type: 'hold',
        asset: 'ADA/USD',
        confidence: 65,
        price: 0.52,
        change: 0.1,
      },
    ]
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const signalColors = {
    buy: 'border-green-500/50 bg-green-500/10',
    sell: 'border-red-500/50 bg-red-500/10',
    hold: 'border-blue-500/50 bg-blue-500/10',
  };

  const signalIcons = {
    buy: '↑',
    sell: '↓',
    hold: '→',
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 border border-blue-500/30 animate-pulse">
        <div className="h-6 bg-blue-500/20 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-blue-500/20 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-blue-300">AuraFX Signals</h2>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Signals Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`border rounded-lg p-4 ${signalColors[signal.type]} hover:scale-[1.02] transition-transform duration-200`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{signalIcons[signal.type]}</span>
                <div>
                  <div className="font-bold text-white">{signal.asset}</div>
                  <div className="text-xs text-gray-400">{formatTime(signal.timestamp)}</div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                signal.type === 'buy' ? 'bg-green-500 text-white' :
                signal.type === 'sell' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {signal.type}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-400">Price: </span>
                <span className="text-white font-semibold">${signal.price.toLocaleString()}</span>
              </div>
              <div className={`font-semibold ${signal.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {signal.change >= 0 ? '+' : ''}{signal.change}%
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">Confidence</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      signal.confidence >= 80 ? 'bg-green-400' :
                      signal.confidence >= 60 ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-white">{signal.confidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
