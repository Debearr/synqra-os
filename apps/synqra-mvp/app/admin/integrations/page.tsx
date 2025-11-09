'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Integration {
  platform: string;
  status: 'connected' | 'disconnected';
  icon: string;
  connectUrl: string;
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const [integrations] = useState<Integration[]>([
    {
      platform: 'LinkedIn',
      status: 'disconnected',
      icon: '💼',
      connectUrl: '/api/oauth/linkedin/start',
    },
    {
      platform: 'TikTok',
      status: 'disconnected',
      icon: '📱',
      connectUrl: '#',
    },
    {
      platform: 'YouTube',
      status: 'disconnected',
      icon: '📺',
      connectUrl: '#',
    },
    {
      platform: 'X (Twitter)',
      status: 'disconnected',
      icon: '🐦',
      connectUrl: '#',
    },
    {
      platform: 'Instagram',
      status: 'disconnected',
      icon: '📸',
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Social Media Integrations</h1>
          <Link
            href="/admin"
            className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.platform}
              className="bg-gray-800 rounded-lg p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{integration.icon}</span>
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
                  className="bg-gray-700 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              ) : integration.status === 'connected' ? (
                <button className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg">
                  Disconnect
                </button>
              ) : (
                <a
                  href={integration.connectUrl}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg inline-block"
                >
                  Connect
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Setup Instructions</h2>

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
                  Set redirect URI to: <code className="bg-gray-900 px-2 py-1 rounded">
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
