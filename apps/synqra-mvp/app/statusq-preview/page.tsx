"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import StatusQ from "@/components/StatusQ";

type Status = "idle" | "generating" | "complete" | "error";

function coerceStatus(value: string | null): Status {
  const v = (value || "").toLowerCase();
  if (v === "generating") return "generating";
  if (v === "complete") return "complete";
  if (v === "error") return "error";
  return "idle";
}

export default function StatusQPreviewPage() {
  const sp = useSearchParams();
  const status = useMemo(() => coerceStatus(sp.get("status")), [sp]);
  const label = sp.get("label") || "STATUSQ_PREVIEW";

  return (
    <main className="min-h-screen bg-noid-black text-white">
      <StatusQ status={status} label={label} />
    </main>
  );
}


