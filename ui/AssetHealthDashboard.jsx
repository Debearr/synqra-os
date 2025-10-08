"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AssetHealthDashboard() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAssets = async () => {
      const { data, error } = await supabase
        .from("asset_logs")
        .select("*")
        .order("last_validated", { ascending: false });
      if (!error && data && isMounted) setAssets(data);
    };
    fetchAssets();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusBadge = (asset) => {
    const lastValid = asset?.last_validated ? new Date(asset.last_validated) : null;
    const healthy = Boolean(asset?.checksum_sha256) &&
      Number(asset?.size_mb) > 1 &&
      lastValid instanceof Date && !isNaN(lastValid);

    return (
      <Badge className={healthy ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}>
        {healthy ? "✅ Healthy" : "⚠️ Needs Check"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">NØID / SYNQRA Asset Health Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="hover:border-teal-400/40 transition-all">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg truncate max-w-[60%]">{asset.filename}</span>
                {statusBadge(asset)}
              </div>
              <div className="text-sm text-neutral-400 space-y-1">
                <p>📁 Project: {asset.project ?? "—"}</p>
                <p>💾 Size: {Number(asset.size_mb ?? 0).toFixed(2)} MB</p>
                <p>🕒 Last Validated: {asset.last_validated ? new Date(asset.last_validated).toLocaleString() : "—"}</p>
                <p className="truncate">🔐 Checksum: {asset.checksum_sha256 ? `${asset.checksum_sha256.slice(0, 12)}…` : "—"}</p>
              </div>
              <Progress value={Math.min((Number(asset.size_mb) || 0) * 10, 100)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
