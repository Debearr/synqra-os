'use client';

import { useState } from 'react';
import TrendPicker from '@/components/pulse/TrendPicker';
import CampaignPreview from '@/components/pulse/CampaignPreview';
import SchedulePanel from '@/components/pulse/SchedulePanel';
import ShareTracker from '@/components/pulse/ShareTracker';
import { PageHeader } from '@/components/luxgrid';

export default function PulseEnginePage() {
  const [activeTab, setActiveTab] = useState<'trends' | 'generate' | 'schedule' | 'analytics'>('trends');
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [generatedCampaign, setGeneratedCampaign] = useState<any>(null);

  return (
    <main className="min-h-screen bg-brand-bg p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="PulseEngine"
          subtitle="Trend-based content automation"
        />

        {/* Tab Navigation */}
        <div className="mt-8 flex gap-4 border-b border-white/10">
          {(['trends', 'generate', 'schedule', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-brand-gold text-brand-gold'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'trends' && (
            <TrendPicker
              selectedTrends={selectedTrends}
              onTrendsChange={setSelectedTrends}
              onNext={() => setActiveTab('generate')}
            />
          )}

          {activeTab === 'generate' && (
            <CampaignPreview
              selectedTrends={selectedTrends}
              campaign={generatedCampaign}
              onCampaignGenerated={setGeneratedCampaign}
              onNext={() => setActiveTab('schedule')}
            />
          )}

          {activeTab === 'schedule' && (
            <SchedulePanel
              campaign={generatedCampaign}
              onScheduled={() => setActiveTab('analytics')}
            />
          )}

          {activeTab === 'analytics' && (
            <ShareTracker campaignId={generatedCampaign?.id} />
          )}
        </div>
      </div>
    </main>
  );
}
