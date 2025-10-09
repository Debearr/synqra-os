"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function StatusPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setLogs(data));
  }, []);

  const synqra = logs.filter((r) => r.service.includes("synqra"));
  const noid = logs.filter((r) => r.service.includes("noidlabs"));

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🩵 System Uptime Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Synqra */}
        <div className="bg-zinc-900 p-4 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Synqra Uptime</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={synqra}>
              <XAxis dataKey="timestamp" hide />
              <YAxis hide domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="status" stroke="#00FFF5" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* NØID */}
        <div className="bg-zinc-900 p-4 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">NØID Uptime</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={noid}>
              <XAxis dataKey="timestamp" hide />
              <YAxis hide domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="status" stroke="#D4AF37" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-gray-500 mt-8 text-sm text-center">
        Data auto-updates every 5 minutes • Brand colors 🩵 / 🟡
      </p>
    </main>
  );
}
