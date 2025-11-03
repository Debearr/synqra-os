'use client';

import React, { useEffect, useState } from 'react';
import { SystemHealth } from '@/app/types/dashboard';

interface SCINMonitorProps {
  initialData?: SystemHealth;
}

export default function SCINMonitor({ initialData }: SCINMonitorProps) {
  const [health, setHealth] = useState<SystemHealth>(
    initialData || {
      status: 'healthy',
      uptime: 99.8,
      autoHealing: true,
      activeIssues: 0,
      resolvedToday: 12,
    }
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const statusColors = {
    healthy: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    critical: 'from-red-500 to-rose-500',
  };

  const statusText = {
    healthy: 'All Systems Operational',
    warning: 'Minor Issues Detected',
    critical: 'Critical Issues',
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6 border border-purple-500/30 animate-pulse">
        <div className="h-6 bg-purple-500/20 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-purple-500/20 rounded w-3/4" />
          <div className="h-4 bg-purple-500/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-purple-300">SCIN Monitor</h2>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${statusColors[health.status]} text-white text-xs font-semibold`}>
          {statusText[health.status]}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
          <div className="text-sm text-gray-400 mb-1">Uptime</div>
          <div className="text-2xl font-bold text-white">{health.uptime}%</div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
          <div className="text-sm text-gray-400 mb-1">Resolved Today</div>
          <div className="text-2xl font-bold text-green-400">{health.resolvedToday}</div>
        </div>
      </div>

      {/* Auto-Healing Status */}
      <div className="flex items-center justify-between bg-black/30 rounded-lg p-4 border border-purple-500/20">
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${health.autoHealing ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-300">Auto-Healing</span>
        </div>
        <span className={`text-sm font-semibold ${health.autoHealing ? 'text-green-400' : 'text-gray-500'}`}>
          {health.autoHealing ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {/* Active Issues */}
      {health.activeIssues > 0 && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-300">{health.activeIssues} active issue(s) detected</span>
          </div>
        </div>
      )}
    </div>
  );
}
