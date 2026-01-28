"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { DisclaimerContent } from "@/lib/compliance/disclaimer-manager";

interface DisclaimerBannerProps {
  content?: string;
  methodologyContent?: string;
  disclaimer?: DisclaimerContent;
  requiresAcknowledgment: boolean;
  triggerMessage?: string;
  onAcknowledge?: () => void;
  isAcknowledging?: boolean;
}

/**
 * Centralized disclaimer banner to keep regulatory copy consistent.
 */
export function DisclaimerBanner({
  content,
  methodologyContent,
  disclaimer,
  requiresAcknowledgment,
  triggerMessage,
  onAcknowledge,
  isAcknowledging = false,
}: DisclaimerBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bannerContent = disclaimer?.short ?? content ?? "";
  const bannerMethodology = disclaimer?.methodology ?? methodologyContent ?? "";

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-900/10">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">{bannerContent}</p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs text-amber-500/80 hover:text-amber-400 transition-colors"
            >
              <span>View full methodology and limitations</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-amber-500/20 bg-amber-900/5 p-4">
          <div className="prose prose-sm prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-xs text-noid-silver/80">
              {bannerMethodology}
            </div>
          </div>
        </div>
      )}

      {requiresAcknowledgment && (
        <div className="border-t border-amber-500/30 bg-amber-900/20 p-4">
          {/* Regulatory safety: explicit re-acknowledgment gate. */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-amber-400 mb-1 font-medium">
                Acknowledgment Required
              </p>
              <p className="text-xs text-noid-silver/70">{triggerMessage}</p>
            </div>
            <button
              onClick={onAcknowledge}
              disabled={isAcknowledging}
              className="px-4 py-2 rounded-lg bg-amber-500 text-black font-medium text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAcknowledging ? "Acknowledging..." : "I Acknowledge"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
