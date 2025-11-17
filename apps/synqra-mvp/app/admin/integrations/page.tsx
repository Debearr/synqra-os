'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LinkedInIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  XIcon,
} from '../../../components/icons/PlatformIcons';

interface Integration {
  platform: string;
  status: 'connected' | 'disconnected';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  connectUrl: string;
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const [integrations] = useState<Integration[]>([
    {
      platform: 'LinkedIn',
      status: 'disconnected',
      icon: LinkedInIcon,
      connectUrl: '/api/oauth/linkedin/start',
    },
    {
      platform: 'Instagram',
      status: 'disconnected',
      icon: InstagramIcon,
      connectUrl: '#',
    },
    {
      platform: 'TikTok',
      status: 'disconnected',
      icon: TikTokIcon,
      connectUrl: '#',
    },
    {
      platform: 'X (Twitter)',
      status: 'disconnected',
      icon: XIcon,
      connectUrl: '#',
    },
    {
      platform: 'YouTube',
      status: 'disconnected',
      icon: YouTubeIcon,
      connectUrl: '#',
    },
  ]);

  useEffect(() => {
    // Show success/error messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'linkedin') {
      alert('✅ LinkedIn connected successfully!');
    } else if (error) {
      alert(`❌ Error: ${error}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social Media Integrations</h1>
            <p className="text-zinc-500 text-sm mt-1">Connect your publishing accounts</p>
          </div>
          <Link
            href="/admin"
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-6 py-2 rounded-xl transition-all font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.platform}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                  integration.platform === 'LinkedIn' ? 'bg-[#0A66C2]/10' :
                  integration.platform === 'Instagram' ? 'bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10' :
                  integration.platform === 'TikTok' ? 'bg-black/20' :
                  integration.platform === 'X (Twitter)' ? 'bg-black/20' :
                  integration.platform === 'YouTube' ? 'bg-[#FF0000]/10' :
                  'bg-white/5'
                }`}>
                  <integration.icon 
                    className={
                      integration.platform === 'LinkedIn' ? 'text-[#0A66C2]' :
                      integration.platform === 'Instagram' ? 'text-[#E1306C]' :
                      integration.platform === 'TikTok' ? 'text-white' :
                      integration.platform === 'X (Twitter)' ? 'text-white' :
                      integration.platform === 'YouTube' ? 'text-[#FF0000]' :
                      'text-white'
                    } 
                    size={28} 
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{integration.platform}</h3>
                  <p className="text-sm text-gray-400">
                    Status:{' '}
                    <span
                      className={
                        integration.status === 'connected'
                          ? 'text-green-400'
                          : 'text-gray-500'
                      }
                    >
                      {integration.status}
                    </span>
                  </p>
                </div>
              </div>

              {integration.connectUrl === '#' ? (
                <button
                  disabled
                  className="bg-zinc-800 text-zinc-600 px-6 py-2 rounded-xl cursor-not-allowed border border-zinc-800"
                >
                  Coming Soon
                </button>
              ) : integration.status === 'connected' ? (
                <button className="bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 px-6 py-2 rounded-xl transition-all">
                  Disconnect
                </button>
              ) : (
                <a
                  href={integration.connectUrl}
                  className="bg-indigo hover:bg-indigo/90 px-6 py-2 rounded-xl inline-block transition-all font-medium"
                >
                  Connect
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 tracking-tight">Setup Instructions</h2>

          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-bold text-white mb-2">LinkedIn</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to{' '}
                  <a
                    href="https://www.linkedin.com/developers/"
                    target="_blank"
                    className="text-blue-400 hover:underline"
                  >
                    LinkedIn Developers
                  </a>
                </li>
                <li>Create an app and get Client ID/Secret</li>
                <li>
                  Set redirect URI to: <code className="bg-black border border-zinc-800 px-2 py-1 rounded text-indigo">
                    https://your-domain.com/api/oauth/linkedin/callback
                  </code>
                </li>
                <li>Add scopes: w_member_social, r_liteprofile</li>
                <li>Update .env with LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">Other Platforms</h3>
              <p>
                TikTok, YouTube, X, and Instagram integrations require similar
                OAuth setup. Check DEPLOYMENT.md for detailed instructions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}
