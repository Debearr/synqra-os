"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface DisclaimerBannerProps {
  content: string;
  methodologyContent: string;
  requiresAcknowledgment: boolean;
  triggerMessage?: string;
  onAcknowledge?: () => void;
  isAcknowledging?: boolean;
}

/**
 * Persistent inline disclaimer banner for AuraFX assessments
 * Always visible, expandable for methodology details
 */
export function DisclaimerBanner({
  content,
  methodologyContent,
  requiresAcknowledgment,
  triggerMessage,
  onAcknowledge,
  isAcknowledging = false,
}: DisclaimerBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-900/10">
      {/* Main Disclaimer - Always Visible */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">{content}</p>

            {/* Expandable Methodology Link */}
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

      {/* Expanded Methodology Section */}
      {isExpanded && (
        <div className="border-t border-amber-500/20 bg-amber-900/5 p-4">
          <div className="prose prose-sm prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-xs text-noid-silver/80">
              {methodologyContent}
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgment Required Section */}
      {requiresAcknowledgment && (
        <div className="border-t border-amber-500/30 bg-amber-900/20 p-4">
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

/**
 * Compact disclaimer for Signals Hub list view
 * Persistent but less prominent
 */
export function CompactDisclaimerBanner({
  content,
  methodologyContent,
}: {
  content: string;
  methodologyContent: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-900/5">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs text-amber-400/90">{content}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">Details</span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-amber-500/20 bg-amber-900/5 px-3 py-2">
          <div className="whitespace-pre-wrap text-xs text-noid-silver/70">
            {methodologyContent}
          </div>
        </div>
      )}
    </div>
  );
}
