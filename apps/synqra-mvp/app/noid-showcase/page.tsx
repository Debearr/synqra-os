"use client"

import React from "react"
import { NeonFrame } from "@/components/noid/NeonFrame"
import { SmartwatchDisplay } from "@/components/noid/SmartwatchDisplay"
import { DriverDashboard } from "@/components/noid/DriverDashboard"
import { HQEnvironment } from "@/components/noid/HQEnvironment"

export default function NoidShowcasePage() {
    return (
        <main className="bg-black min-h-screen text-white">
            <HQEnvironment>
                <div className="space-y-24 py-20 pb-40">

                    {/* Section 1: Logo Modules */}
                    <section className="space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Module 01: Neon Frames</h2>
                            <div className="w-12 h-1 bg-cyan-500 mx-auto" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <NeonFrame variant="standard" label="Standard" />
                            <NeonFrame variant="alert" label="Alert State" />
                            <NeonFrame variant="success" label="Systems Go" />
                            <NeonFrame variant="gold" label="Executive" />
                        </div>
                    </section>

                    {/* Section 2: Smartwatch */}
                    <section className="space-y-8 flex flex-col items-center">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Module 02: Wearable Interface</h2>
                            <div className="w-12 h-1 bg-purple-500 mx-auto" />
                        </div>

                        <SmartwatchDisplay />
                    </section>

                    {/* Section 3: Dashboard */}
                    <section className="space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Module 03: Driver Control</h2>
                            <div className="w-12 h-1 bg-emerald-500 mx-auto" />
                        </div>

                        <div className="border border-zinc-800 rounded-xl overflow-hidden">
                            <DriverDashboard />
                        </div>
                    </section>

                </div>
            </HQEnvironment>
        </main>
    )
}
