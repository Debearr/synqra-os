"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

// --- Glitch Error Boundary ---

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
}

export class GlitchBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="relative w-full h-full min-h-[200px] bg-red-950/20 border border-red-500/50 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                    {/* Chromatic Aberration Layers effectively simulated via shadows/text-shadows for now in Tailwind */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                    <div className="animate-pulse">
                        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 mx-auto drop-shadow-[2px_0_0_rgba(0,255,255,0.7)]" />
                        <h2 className="text-2xl font-black text-red-500 tracking-widest uppercase drop-shadow-[-2px_0_0_rgba(0,255,255,0.5)]">
                            SYSTEM FAILURE
                        </h2>
                        <p className="text-red-400/80 font-mono text-xs mt-2">CRITICAL_PROCESS_DIED</p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-6 px-6 py-2 bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all font-mono text-sm uppercase tracking-wider"
                    >
                // REBOOT_SYSTEM
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

// --- Scanline Skeleton ---

export const ScanlineSkeleton = ({ className }: { className?: string }) => {
    return (
        <div className={cn("relative overflow-hidden bg-zinc-900/50 rounded-lg", className)}>
            {/* Moving Scanline */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(#333_1px,transparent_1px),linear-gradient(90deg,#333_1px,transparent_1px)] bg-[size:10px_10px] opacity-10" />
        </div>
    )
}

// --- Offer Badge ---

export const OfferBadge = ({ score }: { score: number }) => {
    let variant = "low"
    if (score >= 8) variant = "high"
    else if (score >= 5) variant = "mid"

    const styles = {
        high: {
            bg: "bg-emerald-950/80",
            border: "border-emerald-500",
            text: "text-emerald-400",
            label: "PRIORITY",
            glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse"
        },
        mid: {
            bg: "bg-amber-950/80",
            border: "border-amber-500",
            text: "text-amber-400",
            label: "STANDARD",
            glow: ""
        },
        low: {
            bg: "bg-red-950/80",
            border: "border-red-500 border-dashed",
            text: "text-red-400",
            label: "LOW YIELD",
            glow: "opacity-80"
        }
    }[variant]

    return (
        <div className={cn(
            "flex flex-col items-center justify-center px-4 py-2 rounded border backdrop-blur-md",
            styles.bg,
            styles.border,
            styles.glow
        )}>
            <div className={cn("text-3xl font-black italic tracking-tighter", styles.text)}>
                {score.toFixed(1)}
            </div>
            <div className={cn("text-[10px] font-bold uppercase tracking-widest", styles.text)}>
                {styles.label}
            </div>
        </div>
    )
}
