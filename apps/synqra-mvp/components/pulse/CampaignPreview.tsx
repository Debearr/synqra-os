'use client';

import { useState } from 'react';
import { CTAButton } from '../luxgrid';

interface CampaignPreviewProps {
  selectedTrends: string[];
  campaign: any;
  onCampaignGenerated: (campaign: any) => void;
  onNext: () => void;
}

export default function CampaignPreview({
  selectedTrends,
  campaign,
  onCampaignGenerated,
  onNext,
}: CampaignPreviewProps) {
  const [brief, setBrief] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'x']);
  const [generating, setGenerating] = useState(false);

  const platforms = ['youtube', 'tiktok', 'x', 'linkedin', 'instagram'];

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const generateCampaign = async () => {
    if (!brief || selectedPlatforms.length === 0) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/pulse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          trends: selectedTrends,
          platforms: selectedPlatforms,
          user_id: 'demo-user', // Replace with actual user ID
        }),
      });

      const data = await response.json();
      onCampaignGenerated(data);
    } catch (error) {
      console.error('Failed to generate campaign:', error);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
          Content Brief
        </label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What do you want to create content about?"
          className="w-full rounded-lg border border-white/20 bg-black/40 p-4 text-white placeholder-white/30 focus:border-brand-gold focus:outline-none"
          rows={4}
        />
      </div>

      {/* Platform Selection */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <label className="mb-4 block text-sm uppercase tracking-wider text-white/50">
          Target Platforms
        </label>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={`rounded-lg px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                selectedPlatforms.includes(platform)
                  ? 'bg-brand-gold text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <CTAButton
          onClick={generateCampaign}
          disabled={!brief || selectedPlatforms.length === 0 || generating}
        >
          {generating ? 'Generating...' : 'Generate with PulseEngine'}
        </CTAButton>
      </div>

      {/* Campaign Preview */}
      {campaign && (
        <div className="space-y-6">
          <div className="text-center text-sm uppercase tracking-wider text-brand-gold">
            Campaign Generated Successfully
          </div>

          {Object.entries(campaign.variants || {}).map(([platform, variants]: [string, any]) => (
            <div key={platform} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 text-sm uppercase tracking-wider text-white/50">
                {platform}
              </div>
              <div className="space-y-4">
                {variants.slice(0, 1).map((variant: any, index: number) => (
                  <div key={index} className="rounded-lg bg-black/40 p-4">
                    <div className="mb-2 text-xs uppercase text-white/40">Hook</div>
                    <div className="mb-4 text-white">{variant.hook}</div>
                    
                    <div className="mb-2 text-xs uppercase text-white/40">Caption</div>
                    <div className="mb-4 text-white/80">{variant.caption}</div>
                    
                    <div className="mb-2 text-xs uppercase text-white/40">CTA</div>
                    <div className="text-brand-gold">{variant.cta}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Watermark Notice */}
          <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4 text-center text-sm text-white/70">
            <span className="text-brand-gold">💎</span> Posts will include "Created with Synqra" watermark
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <CTAButton onClick={onNext}>
              Schedule Campaign →
            </CTAButton>
          </div>
        </div>
      )}
    </div>
  );
}
