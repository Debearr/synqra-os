"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type NeonVariant = "standard" | "alert" | "success" | "gold"

interface NeonFrameProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: NeonVariant
    children?: React.ReactNode
    label?: string
    intensity?: "low" | "medium" | "high"
    animated?: boolean
}

export const NeonFrame = ({
    variant = "standard",
    children,
    className,
    label,
    intensity = "medium",
    animated = true,
    ...props
}: NeonFrameProps) => {
    const styles = {
        standard: {
            border: "border-cyan-500/50",
            glow: "shadow-[0_0_20px_rgba(6,182,212,0.5)]",
            text: "text-cyan-400",
            bg: "bg-cyan-950/20",
            corner: "bg-cyan-400",
        },
        alert: {
            border: "border-red-500/50",
            glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
            text: "text-red-400",
            bg: "bg-red-950/20",
            corner: "bg-red-400",
        },
        success: {
            border: "border-emerald-500/50",
            glow: "shadow-[0_0_20px_rgba(16,185,129,0.5)]",
            text: "text-emerald-400",
            bg: "bg-emerald-950/20",
            corner: "bg-emerald-400",
        },
        gold: {
            border: "border-amber-500/50",
            glow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]",
            text: "text-amber-400",
            bg: "bg-amber-950/20",
            corner: "bg-amber-400",
        },
    }

    const currentStyle = styles[variant]

    // Intensity adjustments
    const intensityClass = {
        low: "opacity-60",
        medium: "opacity-80",
        high: "opacity-100",
    }[intensity]

    return (
        <motion.div
            initial={animated ? { opacity: 0, scale: 0.95 } : undefined}
            animate={animated ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-xl border backdrop-blur-md",
                currentStyle.border,
                currentStyle.bg,
                currentStyle.glow,
                className
            )}
            {...props}
        >
            {/* Scanline Effect */}
            <div className="pointer-events-none absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat" />

            {/* Corner Accents */}
            <div className={cn("absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 rounded-tl-lg", currentStyle.text)} />
            <div className={cn("absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 rounded-tr-lg", currentStyle.text)} />
            <div className={cn("absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 rounded-bl-lg", currentStyle.text)} />
            <div className={cn("absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 rounded-br-lg", currentStyle.text)} />

            {/* Label Badge */}
            {label && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-black border border-current rounded-full text-[10px] font-bold uppercase tracking-[0.2em] z-10">
                    <span className={currentStyle.text}>{label}</span>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 p-8 h-full w-full">
                {children || (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-6">
                        <h1 className={cn("text-5xl font-black tracking-tighter", currentStyle.text)}>
                            NØID
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">System Protected</p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
