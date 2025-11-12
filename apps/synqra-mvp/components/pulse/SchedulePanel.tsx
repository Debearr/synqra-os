'use client';

import { useState } from 'react';
import { CTAButton } from '../luxgrid';

interface SchedulePanelProps {
  campaign: any;
  onScheduled: () => void;
}

export default function SchedulePanel({ campaign, onScheduled }: SchedulePanelProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSchedule = async () => {
    if (!campaign || !scheduledDate || !scheduledTime) return;

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    
    setScheduling(true);
    try {
      const response = await fetch('/api/pulse/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaign.campaign_id,
          scheduled_for: scheduledFor.toISOString(),
          user_id: 'demo-user', // Replace with actual user ID
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onScheduled();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to schedule:', error);
    }
    setScheduling(false);
  };

  if (!campaign) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
        <div className="text-white/50">
          No campaign to schedule. Please generate a campaign first.
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-12 text-center">
        <div className="mb-4 text-6xl">✓</div>
        <div className="text-xl text-brand-gold">Campaign Scheduled Successfully!</div>
        <div className="mt-4 text-white/70">
          Your content will be published automatically at the scheduled time.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Summary */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-sm uppercase tracking-wider text-white/50">
          Campaign Summary
        </div>
        <div className="space-y-2 text-white/70">
          <div>Platforms: {Object.keys(campaign.variants || {}).join(', ')}</div>
          <div>Variants: {Object.values(campaign.variants || {}).flat().length} pieces</div>
          <div>Tokens used: {campaign.tokens_used || 0}</div>
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-sm uppercase tracking-wider text-white/50">
          Schedule Settings
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-brand-gold focus:outline-none"
            />
          </div>
          
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-brand-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Share Link Preview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-sm uppercase tracking-wider text-white/50">
          Viral Share Link
        </div>
        <div className="rounded-lg bg-black/40 p-4">
          <code className="text-sm text-brand-gold">
            synqra.com/pilot?ref={campaign.campaign_id}
          </code>
        </div>
        <div className="mt-2 text-xs text-white/50">
          This link will be included in posts to track viral growth
        </div>
      </div>

      {/* Schedule Button */}
      <div className="flex justify-center">
        <CTAButton
          label={scheduling ? 'Scheduling...' : 'Schedule Campaign'}
          onClick={handleSchedule}
          disabled={!scheduledDate || !scheduledTime || scheduling}
        />
      </div>
    </div>
  );
}
