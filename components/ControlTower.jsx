"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ControlTower() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const { data: logs, error } = await supabase
      .from("telemetry")
      .select("timestamp,status_code,latency,health")
      .order("timestamp", { ascending: false })
      .limit(40);

    if (!error) {
      setRows((logs ?? []).slice().reverse());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <div className="text-white text-center mt-20">Loading Control Tower...</div>;
  }

  if (!rows.length) {
    return <div className="text-white text-center mt-20">No telemetry yet.</div>;
  }

  const chartData = {
    labels: rows.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Latency (ms)",
        data: rows.map((d) => Number(d.latency)),
        borderColor: "#00ffae",
        backgroundColor: "rgba(0,255,174,0.2)",
        tension: 0.3,
      },
    ],
  };

  const uptime = (rows.filter((d) => String(d.status_code) === "200").length / rows.length) * 100;
  const latest = rows[rows.length - 1];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6 text-[#FFD700] tracking-wide">SYNQRA CONTROL TOWER</h1>
      <div className="text-lg mb-2">Uptime: {uptime.toFixed(2)}%</div>
      <div className="text-lg mb-6">Latest Health: {latest.health} ({latest.latency}ms)</div>
      <div className="w-full max-w-4xl bg-[#111] p-6 rounded-2xl shadow-lg border border-[#222]">
        <Line data={chartData} />
      </div>
      <div className="mt-6 text-sm opacity-70">Last Updated: {new Date(latest.timestamp).toLocaleString()}</div>
    </div>
  );
}
