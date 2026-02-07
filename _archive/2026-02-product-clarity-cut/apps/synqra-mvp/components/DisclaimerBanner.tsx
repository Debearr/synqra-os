"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="mb-6 rounded-xl border border-noid-silver/20 bg-noid-black/40">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 flex-shrink-0 text-noid-silver/70 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-noid-silver">{bannerContent}</p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs text-noid-silver/70 hover:text-noid-silver transition-colors"
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
        <div className="border-t border-noid-silver/20 bg-noid-black/20 p-4">
          <div className="prose prose-sm prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-xs text-noid-silver/80">
              {bannerMethodology}
            </div>
          </div>
        </div>
      )}

      {requiresAcknowledgment && (
        <div className="border-t border-noid-silver/20 bg-noid-black/30 p-4">
          {/* Regulatory safety: explicit re-acknowledgment gate. */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-noid-silver/80 mb-1 font-medium">
                Confirmation Required
              </p>
              <p className="text-xs text-noid-silver/70">{triggerMessage}</p>
            </div>
            <button
              onClick={onAcknowledge}
              disabled={isAcknowledging}
              className="px-4 py-2 rounded-lg bg-noid-gold text-noid-black font-medium text-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAcknowledging ? "Confirming..." : "Understood"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
