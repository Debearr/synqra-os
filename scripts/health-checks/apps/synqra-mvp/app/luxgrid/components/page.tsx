/**
 * LUXGRID COMPONENT LIBRARY SHOWCASE
 * 
 * Visual test page for available LuxGrid UI primitives
 * Route: /luxgrid/components
 */

"use client";

import * as React from "react";
import {
  LuxGridSignature,
  LuxGridDivider,
  LuxGridPageHeader,
  LuxGridTag,
} from "@/components/luxgrid";

export default function LuxGridComponentsShowcase() {
  return (
    <div className="min-h-screen bg-black px-8 py-12">
      <LuxGridPageHeader
        title="LUXGRID LIBRARY"
        subtitle="v1.0 · Core Components"
      />

      <div className="max-w-6xl mx-auto space-y-20">
        {/* DEMO NOTE */}
        <section>
          <div className="bg-indigo/10 border border-indigo/20 rounded-2xl p-6">
            <p className="text-indigo text-sm">
              <strong>LuxGrid Component Demo</strong> — This page showcases the available UI primitives. Component library expansion in progress.
            </p>
          </div>
        </section>

        {/* SIGNATURE */}
        <section>
          <div className="mb-8">
            <LuxGridTag>BRANDING</LuxGridTag>
            <h3 className="text-white text-2xl mt-3 font-medium tracking-wide">
              Signature
            </h3>
            <p className="text-neutral-500 text-sm mt-2">
              Premium signature element for footer and branding.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-xl flex items-center justify-center h-40">
            <LuxGridSignature />
          </div>
        </section>

        {/* DIVIDER */}
        <section>
          <div className="mb-8">
            <LuxGridTag>LAYOUT</LuxGridTag>
            <h3 className="text-white text-2xl mt-3 font-medium tracking-wide">
              Divider
            </h3>
            <p className="text-neutral-500 text-sm mt-2">
              Section dividers with premium styling.
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white/5 p-8 rounded-xl">
              <LuxGridDivider />
            </div>
          </div>
        </section>

        {/* PAGE HEADER */}
        <section>
          <div className="mb-8">
            <LuxGridTag>TYPOGRAPHY</LuxGridTag>
            <h3 className="text-white text-2xl mt-3 font-medium tracking-wide">
              Page Header
            </h3>
            <p className="text-neutral-500 text-sm mt-2">
              Section headers with title and subtitle.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-xl">
            <LuxGridPageHeader
              title="Example Title"
              subtitle="Example subtitle text"
            />
          </div>
        </section>

        {/* TAG */}
        <section>
          <div className="mb-8">
            <LuxGridTag>UI ELEMENTS</LuxGridTag>
            <h3 className="text-white text-2xl mt-3 font-medium tracking-wide">
              Tag
            </h3>
            <p className="text-neutral-500 text-sm mt-2">
              Label tags for categories and status.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-xl flex gap-4 flex-wrap">
            <LuxGridTag>FEATURE</LuxGridTag>
            <LuxGridTag>NEW</LuxGridTag>
            <LuxGridTag>PREMIUM</LuxGridTag>
            <LuxGridTag>BETA</LuxGridTag>
          </div>
        </section>

        {/* FOOTER */}
        <section className="pt-20 border-t border-white/10">
          <div className="flex justify-center">
            <LuxGridSignature />
          </div>
          <p className="text-center text-neutral-600 text-xs mt-6 tracking-wider">
            LUXGRID SYSTEM · SYNQRA × NØID · 2025
          </p>
        </section>
      </div>
    </div>
  );
}
