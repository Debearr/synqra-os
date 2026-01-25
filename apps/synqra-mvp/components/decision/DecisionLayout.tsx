import React from "react";
import { PromptEnvelope } from "../../types/decision-support";
import { cn } from "@/lib/utils"; // Assuming standard utils exist

interface DecisionLayoutProps {
    context: PromptEnvelope;
    children: React.ReactNode;
    className?: string;
}

export function DecisionLayout({ context, children, className }: DecisionLayoutProps) {
    return (
        <div className={cn("flex h-screen w-full bg-neutral-950 text-neutral-100 font-sans", className)}>
            {/* Context Rail (Left Sidebar) */}
            <aside className="w-80 border-r border-neutral-800 bg-neutral-900/50 p-8 flex flex-col gap-6">
                <div className="space-y-2">
                    <div className="text-sm uppercase tracking-widest text-neutral-400 font-mono">
                        Task Context
                    </div>
                    <h1 className="text-xl font-light leading-tight text-white">
                        {context.task}
                    </h1>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto">
                    {Object.entries(context.context).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                            <div className="text-sm text-neutral-400 uppercase tracking-widest">{key}</div>
                            <div className="text-sm text-neutral-300 font-mono break-words bg-neutral-950/50 p-4 rounded-lg border border-neutral-800">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-neutral-800 text-xs text-neutral-600 font-mono">
                    ID: {context.id}
                    <br />
                    {new Date(context.created_at).toLocaleString()}
                </div>
            </aside>

            {/* Main Stage */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
                <div className="flex-1 overflow-y-auto py-16 px-8">
                    <div className="max-w-5xl mx-auto w-full space-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
