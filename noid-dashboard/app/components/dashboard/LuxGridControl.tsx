'use client';

import React, { useEffect, useState } from 'react';
import { AutomationToggle } from '@/app/types/dashboard';

interface LuxGridControlProps {
  initialAutomations?: AutomationToggle[];
}

export default function LuxGridControl({ initialAutomations }: LuxGridControlProps) {
  const [automations, setAutomations] = useState<AutomationToggle[]>(
    initialAutomations || [
      {
        id: '1',
        name: 'Auto-Trading',
        description: 'Execute trades based on AuraFX signals',
        enabled: true,
        category: 'trading',
      },
      {
        id: '2',
        name: 'Risk Monitor',
        description: 'Continuous portfolio risk assessment',
        enabled: true,
        category: 'monitoring',
      },
      {
        id: '3',
        name: 'Smart Rebalancing',
        description: 'Automatic portfolio rebalancing',
        enabled: false,
        category: 'trading',
      },
      {
        id: '4',
        name: 'Anomaly Detection',
        description: 'ML-powered anomaly detection',
        enabled: true,
        category: 'analytics',
      },
      {
        id: '5',
        name: 'Auto-Scaling',
        description: 'Dynamic resource allocation',
        enabled: true,
        category: 'system',
      },
      {
        id: '6',
        name: 'Alert Engine',
        description: 'Multi-channel notifications',
        enabled: false,
        category: 'monitoring',
      },
    ]
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
      )
    );
  };

  const categoryColors = {
    trading: 'text-green-400 border-green-500/30',
    monitoring: 'text-blue-400 border-blue-500/30',
    analytics: 'text-purple-400 border-purple-500/30',
    system: 'text-orange-400 border-orange-500/30',
  };

  const categoryIcons = {
    trading: '💹',
    monitoring: '👁️',
    analytics: '📊',
    system: '⚙️',
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 border border-indigo-500/30 animate-pulse">
        <div className="h-6 bg-indigo-500/20 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-indigo-500/20 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const enabledCount = automations.filter((a) => a.enabled).length;

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-indigo-300">LuxGrid Control</h2>
        <div className="text-xs text-gray-400">
          {enabledCount}/{automations.length} Active
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className={`bg-black/30 rounded-lg p-4 border ${
              automation.enabled ? 'border-indigo-500/30' : 'border-gray-700/30'
            } hover:border-indigo-500/50 transition-all duration-200`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{categoryIcons[automation.category]}</span>
                  <h3 className="font-semibold text-white">{automation.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[automation.category]}`}
                  >
                    {automation.category}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{automation.description}</p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => toggleAutomation(automation.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black ${
                  automation.enabled ? 'bg-indigo-500' : 'bg-gray-700'
                }`}
                aria-label={`Toggle ${automation.name}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    automation.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Status Indicator */}
            <div className="mt-3 flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  automation.enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                }`}
              />
              <span className="text-xs text-gray-400">
                {automation.enabled ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() =>
            setAutomations((prev) => prev.map((a) => ({ ...a, enabled: true })))
          }
          className="flex-1 px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-lg text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
        >
          Enable All
        </button>
        <button
          onClick={() =>
            setAutomations((prev) => prev.map((a) => ({ ...a, enabled: false })))
          }
          className="flex-1 px-4 py-2 bg-gray-700/20 border border-gray-600/50 rounded-lg text-sm font-semibold text-gray-300 hover:bg-gray-700/30 transition-colors"
        >
          Disable All
        </button>
      </div>
    </div>
  );
}
