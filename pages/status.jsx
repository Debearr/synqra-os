import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StatusPage() {
  const [synqraLogs, setSynqraLogs] = useState([]);
  const [noidLogs, setNoidLogs] = useState([]);
  const [synqraColor, setSynqraColor] = useState("");
  const [noidColor, setNoidColor] = useState("");
  const router = useRouter();

  useEffect(() => {
    let channel;

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || "";
      if (!email.endsWith("@synqra.ai")) {
        router.replace("/");
        return;
      }

      const { data: synqraData } = await supabase
        .from("dns_logs")
        .select("timestamp, status, domain, retries")
        .eq("domain", "synqra.co")
        .order("timestamp", { ascending: false })
        .limit(20);

      const { data: noidData } = await supabase
        .from("dns_logs")
        .select("timestamp, status, domain, retries")
        .eq("domain", "noidlabs.app")
        .order("timestamp", { ascending: false })
        .limit(20);

      if (synqraData) {
        const reversed = [...synqraData].reverse();
        setSynqraLogs(reversed);
        const latest = reversed.at(-1)?.status;
        if (latest?.includes("LIVE")) setSynqraColor("text-green-400");
        else if (latest?.includes("SSL")) setSynqraColor("text-yellow-400");
        else setSynqraColor("text-red-500");
      }

      if (noidData) {
        const reversed = [...noidData].reverse();
        setNoidLogs(reversed);
        const latest = reversed.at(-1)?.status;
        if (latest?.includes("LIVE")) setNoidColor("text-green-400");
        else if (latest?.includes("SSL")) setNoidColor("text-yellow-400");
        else setNoidColor("text-red-500");
      }

      channel = supabase
        .channel("realtime:dns_logs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "dns_logs" },
          (payload) => {
            if (payload.new.domain === "synqra.co")
              setSynqraLogs((prev) => [...prev.slice(-19), payload.new]);
            if (payload.new.domain === "noidlabs.app")
              setNoidLogs((prev) => [...prev.slice(-19), payload.new]);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const formatChart = (logs) =>
    logs.map((log) => ({
      time: new Date(log.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      retries: log.retries,
      status: log.status?.includes("LIVE") ? 3 : log.status?.includes("SSL") ? 2 : 1,
    }));

  const synqraChart = formatChart(synqraLogs);
  const noidChart = formatChart(noidLogs);

  const StatusChart = ({ title, color, logs, chartData }) => (
    <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-md">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className={`text-lg ${color} mb-4`}>
          Current Status: {logs.at(-1)?.status || "Checking..."}
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#666" />
              <YAxis
                domain={[0, 3]}
                tickFormatter={(v) => (v === 3 ? "🟢 LIVE" : v === 2 ? "🟡 SSL" : v === 1 ? "🔴 OFF" : "")}
                stroke="#666"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="status"
                stroke="#00FFF5"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#D4AF37" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 grid gap-8 md:grid-cols-2">
      <StatusChart
        title="🛰️ Synqra.co Status"
        color={synqraColor}
        logs={synqraLogs}
        chartData={synqraChart}
      />
      <StatusChart
        title="🚗 NoIDLabs.app Status"
        color={noidColor}
        logs={noidLogs}
        chartData={noidChart}
      />
    </div>
  );
}
