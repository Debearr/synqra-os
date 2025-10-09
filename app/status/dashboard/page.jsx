"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StatusDashboard() {
  const [uptime, setUptime] = useState([]);
  const [qcScores, setQcScores] = useState([]);
  const [agents, setAgents] = useState([]);
  const [queueStats, setQueueStats] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: uptimeData } = await supabase
        .from("uptime_log")
        .select("endpoint, up, latency_ms, checked_at")
        .order("checked_at", { ascending: false })
        .limit(40);
      setUptime(uptimeData || []);

      const { data: qcData } = await supabase
        .from("assets")
        .select("brand_id, qc_score")
        .not("qc_score", "is", null);

      const avgByBrand = (qcData || []).reduce((acc, row) => {
        if (!acc[row.brand_id]) acc[row.brand_id] = [];
        acc[row.brand_id].push(row.qc_score);
        return acc;
      }, {});

      const avgByBrandArray = Object.entries(avgByBrand).map(([brand, scores]) => ({
        brand,
        avg_score: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
      }));

      setQcScores(avgByBrandArray);

      const { data: queueData } = await supabase
        .from("content_queue")
        .select("status")
        .limit(100);

      const countByStatus = ["draft", "scheduled", "published"].map((s) => ({
        status: s,
        count: (queueData || []).filter((r) => r.status === s).length,
      }));
      setQueueStats(countByStatus);

      setAgents([
        { name: "Brand Voice", lastRun: "Every 6h", status: "✅" },
        { name: "Creative Loop", lastRun: "Webhook/manual", status: "✅" },
        { name: "Brand QC", lastRun: "Webhook/manual", status: "✅" },
        { name: "Scheduler", lastRun: "Webhook/manual", status: "✅" },
        { name: "Uptime Watch", lastRun: "Every 5m", status: "✅" },
      ]);
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-950 text-white min-h-screen">
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader><h2 className="text-lg font-bold">🧩 Agent Health</h2></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {agents.map((a) => (
              <li key={a.name} className="flex justify-between border-b border-neutral-800 pb-1">
                <span>{a.name}</span>
                <span>{a.status} {a.lastRun}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader><h2 className="text-lg font-bold">📊 Brand QC Scores</h2></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={qcScores}>
              <XAxis dataKey="brand" tick={{ fill: "#aaa" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#aaa" }} />
              <Tooltip />
              <Bar dataKey="avg_score" fill="#00FF99" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-700 md:col-span-2">
        <CardHeader><h2 className="text-lg font-bold">🌐 Uptime Monitor (Synqra + NoID)</h2></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={(uptime || []).map((u) => ({
              time: new Date(u.checked_at).toLocaleTimeString(),
              latency: u.latency_ms,
              endpoint: u.endpoint,
            }))}>
              <XAxis dataKey="time" tick={{ fill: "#aaa" }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="latency" stroke="#00FF99" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-700 md:col-span-2">
        <CardHeader><h2 className="text-lg font-bold">📅 Queue Status</h2></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {queueStats.map((s) => (
              <div key={s.status} className="flex-1 text-center border border-neutral-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-lime-400">{s.count}</div>
                <div className="uppercase text-xs text-neutral-400">{s.status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
