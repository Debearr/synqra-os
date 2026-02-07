"use client";

import dynamic from "next/dynamic";
import { ExecutiveSummaryPage } from "@/features/executive-summary/ExecutiveSummaryPage";

function ExecSummaryInner() {
  return <ExecutiveSummaryPage />;
}

// Prevent Cursor webview DOM instrumentation from triggering hydration mismatch warnings.
const ExecSummaryClientOnly = dynamic(async () => ExecSummaryInner, { ssr: false });

export default function ExecSummaryPage() {
  return <ExecSummaryClientOnly />;
}
