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
  const [logs, setLogs] = useState([]);
  const [statusColor, setStatusColor] = useState("");
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

      const { data } = await supabase
        .from("dns_logs")
        .select("timestamp, status, retries")
        .order("timestamp", { ascending: false })
        .limit(20);

      if (data) {
        const reversed = [...data].reverse();
        setLogs(reversed);
        const latest = reversed.at(-1)?.status;
        if (latest?.includes("LIVE")) setStatusColor("text-green-400");
        else if (latest?.includes("SSL")) setStatusColor("text-yellow-400");
        else setStatusColor("text-red-500");
      }

      channel = supabase
        .channel("realtime:dns_logs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "dns_logs" },
          (payload) => setLogs((prev) => [...prev.slice(-19), payload.new])
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const chartData = logs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    retries: log.retries,
    status: log.status?.includes("LIVE") ? 3 : log.status?.includes("SSL") ? 2 : 1,
  }));

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Card className="shadow-md">
        <CardContent>
          <h1 className="text-3xl font-bold mb-2">🛰️ Synqra System Status</h1>
          <p className={`text-lg ${statusColor} mb-4`}>
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
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }} />
                <Line type="monotone" dataKey="status" stroke="#00FFF5" strokeWidth={2.5} dot={{ r: 4, fill: "#D4AF37" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">📊 Recent Logs</h2>
            <div className="grid grid-cols-3 text-sm gap-2">
              <div className="font-semibold">Time</div>
              <div className="font-semibold">Status</div>
              <div className="font-semibold">Retries</div>
              {logs.map((log) => (
                <Fragment key={log.timestamp}>
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div>{log.status}</div>
                  <div>{log.retries}</div>
                </Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
