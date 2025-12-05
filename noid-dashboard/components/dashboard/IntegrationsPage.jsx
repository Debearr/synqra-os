"use client";

import React from 'react';
import DashboardLayout from './DashboardLayout';
import {
  Check,
  Plus,
  Settings,
  AlertCircle,
  Link2
} from 'lucide-react';
import { Card } from '@/app/components/ui/Card';
import { Progress } from '@/app/components/ui/Progress';
import { EmptyState } from '@/app/components/ui/EmptyState';

const IntegrationsPage = () => {
  const connectedIntegrations = [
    {
      name: 'Instagram Business',
      category: 'Social Media',
      status: 'connected',
      description: 'Post management, analytics, and story scheduling',
      accounts: 2,
      lastSync: '2 minutes ago'
    },
    {
      name: 'LinkedIn Company',
      category: 'Social Media',
      status: 'connected',
      description: 'Professional content publishing and analytics',
      accounts: 1,
      lastSync: '5 minutes ago'
    },
    {
      name: 'Twitter/X',
      category: 'Social Media',
      status: 'connected',
      description: 'Tweet scheduling and thread management',
      accounts: 1,
      lastSync: '1 hour ago'
    },
    {
      name: 'ChatGPT',
      category: 'AI Service',
      status: 'connected',
      description: 'GPT-4 Turbo for content generation',
      accounts: 1,
      lastSync: 'Active'
    },
    {
      name: 'Claude AI',
      category: 'AI Service',
      status: 'connected',
      description: 'Claude Opus for long-form content',
      accounts: 1,
      lastSync: 'Active'
    },
    {
      name: 'Google Gemini',
      category: 'AI Service',
      status: 'connected',
      description: 'Gemini Pro for multi-modal content',
      accounts: 1,
      lastSync: 'Active'
    }
  ];

  const availableIntegrations = [
    {
      name: 'Facebook Pages',
      category: 'Social Media',
      status: 'available',
      description: 'Connect Facebook business pages for content distribution'
    },
    {
      name: 'TikTok Business',
      category: 'Social Media',
      status: 'available',
      description: 'Video content management and analytics'
    },
    {
      name: 'Pinterest Business',
      category: 'Social Media',
      status: 'available',
      description: 'Pin scheduling and board management'
    },
    {
      name: 'Grok AI',
      category: 'AI Service',
      status: 'available',
      description: 'X.AI\'s Grok for real-time content generation'
    },
    {
      name: 'DALL-E 3',
      category: 'AI Service',
      status: 'available',
      description: 'AI image generation for visual content'
    },
    {
      name: 'Midjourney',
      category: 'AI Service',
      status: 'available',
      description: 'Premium AI image generation'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-green-400 bg-green-400/10';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-noid-silver bg-noid-charcoal-light';
    }
  };

  const getCategoryIcon = (category) => {
    return category === 'AI Service' ? '🤖' : '📱';
  };

  return (
    <DashboardLayout activePage="integrations">
      {/* Header */}
      <div className="bg-gradient-gold rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-noid-black/20 rounded-lg">
            <Link2 className="w-6 h-6 text-noid-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-display text-noid-black mb-2">Connected Integrations</h3>
            <p className="text-noid-black/80">
              You have 6 active integrations enabling full automation across all platforms
            </p>
          </div>
          <div className="px-4 py-2 bg-noid-black/10 rounded-lg">
            <span className="text-sm text-noid-black font-medium">100% Uptime</span>
          </div>
        </div>
      </div>

      {/* Connected Integrations */}
      <div className="mb-8">
        <h3 className="text-xl font-display text-noid-white mb-4">Active Integrations</h3>
        {connectedIntegrations.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Link2 className="w-16 h-16" />}
              title="No integrations connected"
              description="Connect your social media accounts and AI services to get started."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedIntegrations.map((integration) => (
              <Card
                key={integration.name}
                className="hover:border-noid-gold/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(integration.category)}</span>
                    <div>
                      <h4 className="text-lg font-medium text-noid-white">{integration.name}</h4>
                      <span className="text-xs text-noid-silver">{integration.category}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    <Check className="w-3 h-3 inline mr-1" />
                    Connected
                  </div>
                </div>

                <p className="text-sm text-noid-silver mb-4">{integration.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-noid-charcoal-light">
                  <div className="flex items-center gap-4 text-xs text-noid-silver">
                    <span>{integration.accounts} account{integration.accounts > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>Last sync: {integration.lastSync}</span>
                  </div>
                  <button className="p-2 hover:bg-noid-charcoal-light rounded-lg text-noid-silver hover:text-noid-white transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Integrations */}
      <div>
        <h3 className="text-xl font-display text-noid-white mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableIntegrations.map((integration) => (
            <Card
              key={integration.name}
              className="hover:border-noid-gold/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-50">{getCategoryIcon(integration.category)}</span>
                  <div>
                    <h4 className="text-lg font-medium text-noid-white">{integration.name}</h4>
                    <span className="text-xs text-noid-silver">{integration.category}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-noid-silver mb-4">{integration.description}</p>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-gold text-noid-black font-medium rounded-lg hover:shadow-gold-glow transition-all">
                <Plus className="w-4 h-4" />
                Connect
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Integration Health */}
      <Card className="mt-8">
        <h3 className="text-lg font-display text-noid-white mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-noid-black rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-noid-silver">API Uptime</span>
              <span className="text-lg font-bold text-green-400">100%</span>
            </div>
            <Progress value={100} />
          </div>
          <div className="p-4 bg-noid-black rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-noid-silver">Sync Success</span>
              <span className="text-lg font-bold text-green-400">98.7%</span>
            </div>
            <Progress value={98.7} />
          </div>
          <div className="p-4 bg-noid-black rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-noid-silver">AI Response</span>
              <span className="text-lg font-bold text-green-400">1.2s</span>
            </div>
            <Progress value={95} />
          </div>
        </div>
      </Card>

      {/* Warning Notice */}
      <div className="mt-6 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-medium text-yellow-400 mb-2">Rate Limit Notice</h4>
            <p className="text-noid-silver">
              Some AI providers have rate limits. Your current plan includes unlimited access, 
              but individual API providers may have their own restrictions during peak hours.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsPage;

