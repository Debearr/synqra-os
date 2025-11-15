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
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-md mx-auto mt-20">
          <h1 className="text-3xl font-bold mb-8">Synqra Admin</h1>
          <div className="bg-gray-800 rounded-lg p-6">
            <label className="block text-sm font-medium mb-2">
              Admin Token
            </label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg mb-4"
              placeholder="Enter admin token"
            />
            <button
              onClick={loadJobs}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Synqra Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/integrations"
              className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg"
            >
              Integrations
            </Link>
            <button
              onClick={() => setAuthenticated(false)}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No pending jobs
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-800 rounded-lg p-6">
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
                      className="bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-400">
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
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium"
                >
                  Approve & Publish All Platforms
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
