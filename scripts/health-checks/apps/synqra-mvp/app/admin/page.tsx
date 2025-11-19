'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Job {
  id: string;
  brief: string;
  status: string;
  created_at: string;
  variants: Array<{
    id: string;
    platform: string;
    content: string;
    media_url?: string;
  }>;
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const loadJobs = async () => {
    if (!adminToken) return;

    try {
      const response = await fetch(`/api/approve?adminToken=${adminToken}`);
      const data = await response.json();

      if (data.ok) {
        setJobs(data.jobs);
        setAuthenticated(true);
      } else {
        alert('Invalid admin token');
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveJob = async (jobId: string, platforms: string[]) => {
    if (!confirm(`Approve and publish to ${platforms.join(', ')}?`)) return;

    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          platforms,
          adminToken,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        alert(data.message);
        loadJobs();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to approve job');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo/10 text-indigo text-xs font-medium mb-4 uppercase tracking-wider">
              ADMIN ACCESS
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Synqra Admin</h1>
            <p className="text-zinc-500 text-sm mt-2">NØID Labs Dashboard</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <label className="block text-sm font-medium mb-2 text-zinc-400">
              Admin Token
            </label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl mb-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition-all"
              placeholder="Enter admin token"
            />
            <button
              onClick={loadJobs}
              className="w-full bg-indigo hover:bg-indigo/90 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Content approval & management</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/integrations"
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-6 py-2 rounded-xl transition-all font-medium"
            >
              Integrations
            </Link>
            <button
              onClick={() => setAuthenticated(false)}
              className="bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 px-6 py-2 rounded-xl transition-all font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-indigo/30 border-t-indigo rounded-full animate-spin"></div>
            <p className="text-zinc-500 mt-4">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-zinc-400 font-medium">No pending jobs</p>
            <p className="text-zinc-600 text-sm mt-2">All content approved or no active workflows</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{job.brief}</h3>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(job.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">Status: {job.status}</p>
                  </div>
                </div>

                <div className="grid gap-4 mb-4">
                  {job.variants?.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-black/40 border border-zinc-800 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-indigo uppercase text-xs tracking-wider">
                          {variant.platform}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mb-2">
                        {variant.content}
                      </p>
                      {variant.media_url && (
                        <div className="mt-2">
                          <img
                            src={variant.media_url}
                            alt="Media"
                            className="max-w-xs rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    approveJob(
                      job.id,
                      job.variants?.map((v) => v.platform) || []
                    )
                  }
                  className="bg-emerald-400 hover:bg-emerald-300 text-black px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✓ Approve & Publish All Platforms
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
