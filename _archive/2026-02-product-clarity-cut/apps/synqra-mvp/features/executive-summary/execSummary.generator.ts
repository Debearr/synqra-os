import type { ExecSummaryData } from "./execSummary.types";
import { synqraExecSummaryData } from "./execSummary.data.synqra";

export type ExecSummarySection = {
  id: string;
  title: string;
  body?: string;
};

export type ExecSummaryDoc = {
  meta: {
    brandName: string;
    productName: string;
    tagline: string;
    periodLabel: string;
  };
  metrics: {
    targetRaise: string;
    targetRaiseNote: string;
    targetRevenue: string;
    targetRevenueNote: string;
  };
  sections: ExecSummarySection[];
  data: ExecSummaryData;
};

/**
 * buildExecSummary
 * Turns raw ExecSummaryData into a normalized structure.
 * Later, agents can call this with different data payloads per product.
 */
export function buildExecSummary(
  data: ExecSummaryData = synqraExecSummaryData
): ExecSummaryDoc {
  const sections: ExecSummarySection[] = [
    {
      id: "overview",
      title: "Overview",
      body: data.overview
    },
    {
      id: "market-problem",
      title: "Market Problem",
      body: data.marketProblem
    }
    // Other sections (solution, revenue, etc.) are rendered
    // directly from arrays for flexibility.
  ];

  return {
    meta: {
      brandName: data.brandName,
      productName: data.productName,
      tagline: data.tagline,
      periodLabel: data.periodLabel
    },
    metrics: {
      targetRaise: data.targetRaise,
      targetRaiseNote: data.targetRaiseNote,
      targetRevenue: data.targetRevenue,
      targetRevenueNote: data.targetRevenueNote
    },
    sections,
    data
  };
}

