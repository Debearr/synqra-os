import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsDashboard() {
  const [usage, setUsage] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [thresholds, setThresholds] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [uRes, rRes, tRes] = await Promise.all([
        fetch("/api/usage").then(r => r.json()),
        fetch("/api/ratings").then(r => r.json()),
        fetch("/api/thresholds").then(r => r.json())
      ]);
      setUsage(uRes);
      setRatings(rRes);
      setThresholds(tRes);
    }
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-gold">LEONARDO ANALYTICS DASHBOARD</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-neutral-900 border-gold border">
          <CardContent>
            <h2 className="text-xl font-semibold text-gold mb-4">💳 Credit Usage (USD)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="created_at" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="total_spent_usd" stroke="#00FFF5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-gold border">
          <CardContent>
            <h2 className="text-xl font-semibold text-gold mb-4">⭐ Visual Quality Ratings</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ratings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="created_at" stroke="#888" />
                <YAxis domain={[0, 5]} stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#FFD700" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-gold border">
          <CardContent>
            <h2 className="text-xl font-semibold text-gold mb-4">⚙️ Adaptive Threshold</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={thresholds}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="updated_at" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="min_word_threshold" stroke="#00FFF5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
