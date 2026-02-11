/**
 * SYNQRA COMPONENT LIBRARY SHOWCASE
 * 
 * Visual test page for all Synqra UI primitives
 * Route: /luxgrid/components
 */

"use client";

import * as React from "react";
import {
  LuxGridLogo,
  LuxGridBarcode,
  LuxGridSignature,
  LuxGridEndCard,
  LuxGridDivider,
  LuxGridPageHeader,
  LuxGridCTAButton,
  LuxGridTag,
  LuxGridCard,
} from "@/components/luxgrid";

export default function LuxGridComponentsShowcase() {
  const [showEndCard, setShowEndCard] = React.useState(false);

  if (showEndCard) {
    return (
      <>
        <LuxGridEndCard
          brand="synqra"
          tagline="Drive Unseen. Earn Smart."
          barcodeAccent="emerald"
        />
        <button
          onClick={() => setShowEndCard(false)}
          className="fixed top-4 right-4 px-4 py-2 bg-lux-white text-lux-black text-sm tracking-wider z-50"
        >
          CLOSE
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-lux-black text-lux-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <LuxGridPageHeader
          title="SYNQRA COMPONENTS"
          subtitle="Synqra UI component library"
          dividerColor="emerald"
        />
      </div>

      {/* Component Showcase Grid */}
      <div className="container mx-auto px-6 pb-24 max-w-7xl space-y-24">
        
        {/* Section: Logos */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Logo Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px]">
              <LuxGridLogo variant="synqra" size="lg" color="white" />
              <p className="mt-4 text-sm text-lux-white/50">SYNQRA / Large / White</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px]">
              <LuxGridLogo variant="synqra" size="md" color="gold" />
              <p className="mt-4 text-sm text-lux-white/50">SYNQRA / Medium / Gold</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px]">
              <LuxGridLogo variant="synqra" size="sm" color="emerald" />
              <p className="mt-4 text-sm text-lux-white/50">SYNQRA / Small / Emerald</p>
            </div>
          </div>
        </section>

        {/* Section: Barcodes */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Barcode Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px]">
              <LuxGridBarcode width={320} height={48} accent="emerald" />
              <p className="mt-4 text-sm text-lux-white/50">Emerald Accent</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px]">
              <LuxGridBarcode width={320} height={48} accent="gold" />
              <p className="mt-4 text-sm text-lux-white/50">Gold Accent</p>
            </div>
          </div>
        </section>

        {/* Section: Signature */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Signature Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[150px]">
              <LuxGridSignature color="white" size="lg" />
              <p className="mt-4 text-sm text-lux-white/50">Large / White</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[150px]">
              <LuxGridSignature color="gold" size="md" />
              <p className="mt-4 text-sm text-lux-white/50">Medium / Gold</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[150px]">
              <LuxGridSignature color="emerald" size="sm" />
              <p className="mt-4 text-sm text-lux-white/50">Small / Emerald</p>
            </div>
          </div>
        </section>

        {/* Section: Dividers */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Divider Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="space-y-8">
            <div className="p-8 border border-lux-white/20">
              <p className="mb-4 text-sm text-lux-white/50">Emerald / Medium / Full Width</p>
              <LuxGridDivider color="emerald" thickness="medium" width="full" />
            </div>
            
            <div className="p-8 border border-lux-white/20">
              <p className="mb-4 text-sm text-lux-white/50">Gold / Thick / Large</p>
              <LuxGridDivider color="gold" thickness="thick" width="lg" />
            </div>
            
            <div className="p-8 border border-lux-white/20">
              <p className="mb-4 text-sm text-lux-white/50">White / Thin / Medium</p>
              <LuxGridDivider color="white" thickness="thin" width="md" />
            </div>
          </div>
        </section>

        {/* Section: Buttons */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            CTA Button Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px] gap-4">
              <LuxGridCTAButton variant="primary" size="lg">
                Get Started
              </LuxGridCTAButton>
              <p className="text-sm text-lux-white/50">Primary / Large</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px] gap-4">
              <LuxGridCTAButton variant="secondary" size="md">
                Learn More
              </LuxGridCTAButton>
              <p className="text-sm text-lux-white/50">Secondary / Medium</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-lux-white/20 min-h-[200px] gap-4">
              <LuxGridCTAButton variant="ghost" size="sm">
                Contact Us
              </LuxGridCTAButton>
              <p className="text-sm text-lux-white/50">Ghost / Small</p>
            </div>
          </div>
        </section>

        {/* Section: Tags */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Tag Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="flex flex-wrap gap-4 p-8 border border-lux-white/20">
            <LuxGridTag variant="emerald" size="md">NEW</LuxGridTag>
            <LuxGridTag variant="gold" size="md">PREMIUM</LuxGridTag>
            <LuxGridTag variant="white" size="md">FEATURED</LuxGridTag>
            <LuxGridTag variant="black" size="md">BETA</LuxGridTag>
            <LuxGridTag variant="emerald" size="sm">LIVE</LuxGridTag>
            <LuxGridTag variant="gold" size="sm">PRO</LuxGridTag>
          </div>
        </section>

        {/* Section: Cards */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Card Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <LuxGridCard
              variant="dark"
              padding="lg"
              header={
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-wider">SYNQRA</h3>
                  <LuxGridTag variant="emerald" size="sm">ACTIVE</LuxGridTag>
                </div>
              }
              footer={
                <div className="flex justify-end">
                  <LuxGridCTAButton variant="ghost" size="sm">
                    View Details
                  </LuxGridCTAButton>
                </div>
              }
            >
              <p className="text-base leading-relaxed opacity-80">
                AI-powered automation platform for LinkedIn content generation.
                Drive unseen. Earn smart.
              </p>
            </LuxGridCard>
            
            <LuxGridCard
              variant="outlined"
              padding="lg"
              header={
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-wider">SYNQRA</h3>
                  <LuxGridTag variant="gold" size="sm">PREMIUM</LuxGridTag>
                </div>
              }
              footer={
                <div className="flex justify-end">
                  <LuxGridCTAButton variant="primary" size="sm">
                    Learn More
                  </LuxGridCTAButton>
                </div>
              }
            >
              <p className="text-base leading-relaxed opacity-80">
                Revolutionary digital identity platform. Your identity, redefined.
              </p>
            </LuxGridCard>
          </div>
        </section>

        {/* Section: EndCard Preview */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            EndCard Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="p-8 border border-lux-white/20">
            <p className="mb-6 text-sm text-lux-white/50">
              Full-screen end card for CapCut exports (click to preview)
            </p>
            <LuxGridCTAButton 
              variant="primary" 
              size="lg"
              onClick={() => setShowEndCard(true)}
            >
              Preview EndCard
            </LuxGridCTAButton>
          </div>
        </section>

        {/* Section: Page Header */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-[0.15em] text-lux-emerald uppercase">
            Page Header Component
          </h2>
          <LuxGridDivider color="emerald" thickness="thin" width="full" />
          
          <div className="p-8 border border-lux-white/20">
            <LuxGridPageHeader
              title="Example Page"
              subtitle="This is how page headers look with title and subtitle"
              dividerColor="gold"
            />
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-lux-white/20 py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <LuxGridLogo variant="synqra" size="sm" color="white" />
              <LuxGridDivider color="emerald" thickness="medium" width="sm" />
              <LuxGridSignature color="emerald" size="sm" />
            </div>
            
            <p className="text-sm tracking-[0.12em] text-lux-white/50 uppercase">
              Synqra System · 2025
            </p>
            
            <LuxGridBarcode width={160} height={24} accent="emerald" />
          </div>
        </div>
      </div>
    </div>
  );
}
