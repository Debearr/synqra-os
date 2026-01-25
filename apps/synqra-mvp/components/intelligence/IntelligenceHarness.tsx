
import React, { useState } from 'react';
import { PipelineProgress } from './PipelineProgress';
import { ManualVerificationScreen } from './ManualVerification';
import { BrandSafetyAlert } from './BrandSafetyModal';
import { StreamingConsole } from './StreamingConsole';
import { ImageNormalizer } from './ImageNormalizer';
import { PipelineState, ExtractionData, VisualExtraction } from './types';

// Demo Data v2.1.1
const DEMO_EXTRACTION: ExtractionData = {
    meta: {
        confidence: 0.72,
        id: 'REQ-8821',
        modelUsed: 'gemini',
        triggerReason: ['Low Global Confidence (<0.85)', 'Aesthetic Score < 60', 'Color Count < 2']
    },
    data: {
        visual: {
            brandColors: [
                { hex: '#000000', name: 'Matte Black', confidence: 0.99 }
            ],
            aestheticScore: 55,
            vibe: { primary: 'Luxury', secondary: 'Minimalist', confidence: 0.55 },
            typography: { isSerif: false, detectedFontName: 'Unknown Sans', confidence: 0.60 },
            detectedText: "SYNQRA PILOT // V2.1.1\nERROR: FONT NOT FOUND\n"
        }
    }
};

const STREAM_MOCK = `{
  "status": "active",
  "chunk_id": "8fa1-22b",
  "data": {
     "insight": "High correlation between luxury aesthetic and user intent.",
     "strategy": "Deploy aggressive high-ticket retargeting."
  }
}`;

export const IntelligenceHarness = () => {
    // Harness State matching 7-step pipeline
    const [pipelineState, setPipelineState] = useState<PipelineState>('extracting');
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [showManualVerify, setShowManualVerify] = useState(false);

    // Actions for wiring
    const advancePipeline = () => {
        const flow: PipelineState[] = [
            'extracting',
            'validating',
            'brand-safety-precheck',
            'manual-verification',
            'generating',
            'streaming',
            'final-safety-check',
            'complete'
        ];
        const currentIndex = flow.indexOf(pipelineState);
        const next = flow[currentIndex + 1] || 'complete';

        setPipelineState(next as PipelineState);

        // Auto-triggers for demo
        if (next === 'brand-safety-precheck') setShowSafetyModal(true);
        if (next === 'manual-verification') setShowManualVerify(true);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-brand-fg flex flex-col font-sans">
            {/* Top Bar: Pipeline Status */}
            <div className="border-b border-white/10">
                <PipelineProgress currentState={pipelineState} />
            </div>

            {/* Main Workspace */}
            <div className="flex-1 relative flex">
                {/* Left: Visualization / Normalizer */}
                <div className="hidden lg:block w-[400px] border-r border-white/10 p-6 bg-black/40">
                    <h3 className="text-xs uppercase tracking-widest text-white/30 mb-4 font-display">Input Pre-Processing</h3>
                    <div className="aspect-[3/4] mb-8">
                        <ImageNormalizer src="/demo-input.jpg" />
                    </div>

                    <div className="p-4 rounded border border-white/5 bg-white/5">
                        <h4 className="text-[10px] uppercase text-brand-teal mb-2 font-bold">Pipeline Telemetry</h4>
                        <div className="space-y-1 font-mono text-[10px] text-white/50">
                            <div className="flex justify-between"><span>Latency:</span> <span className="text-brand-fg">124ms</span></div>
                            <div className="flex justify-between"><span>Model:</span> <span className="text-brand-fg">Gemini Pro 3</span></div>
                            <div className="flex justify-between"><span>Status:</span> <span className="text-brand-gold animate-pulse">{pipelineState.toUpperCase()}</span></div>
                        </div>
                    </div>
                </div>

                {/* Middle: Active Component Harness */}
                <div className="flex-1 p-8 relative flex flex-col">
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <button onClick={() => setShowSafetyModal(true)} className="px-3 py-1 bg-amber-900/20 text-amber-500 text-[10px] border border-amber-500/20 rounded hover:bg-amber-900/40">
                            Test Safety Pre-Check
                        </button>
                        <button onClick={() => setShowManualVerify(true)} className="px-3 py-1 bg-teal-900/20 text-teal-500 text-[10px] border border-teal-500/20 rounded hover:bg-teal-900/40">
                            Test Manual Verify
                        </button>
                        <button onClick={advancePipeline} className="px-3 py-1 bg-white/10 text-white text-[10px] border border-white/10 rounded hover:bg-white/20">
                            Next Step
                        </button>
                    </div>

                    {/* Render Main View based on State */}
                    <div className="flex-1 flex items-center justify-center">
                        {pipelineState === 'streaming' || pipelineState === 'generating' ? (
                            <StreamingConsole
                                activeModel="gemini"
                                streamText={pipelineState === 'streaming' ? STREAM_MOCK : ''}
                                isStreaming={pipelineState === 'streaming'}
                            />
                        ) : (
                            <div className="text-center">
                                <div className="text-6xl font-display font-bold text-white/5 mb-4">{pipelineState}</div>
                                <div className="text-sm text-white/20 font-mono uppercase tracking-widest">Waiting for subsystem...</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals wired to state */}
            {showSafetyModal && (
                <BrandSafetyAlert
                    isOpen={true}
                    score={45}
                    flags={['COMPETITOR_DETECTED', 'LOW_QUALITY']}
                    onOverride={() => setShowSafetyModal(false)}
                    onRepair={() => { console.log('Repair'); setShowSafetyModal(false); }}
                    onDiscard={() => setShowSafetyModal(false)}
                />
            )}

            {showManualVerify && (
                <ManualVerificationScreen
                    sourceUrl="/demo-input.jpg"
                    initialData={DEMO_EXTRACTION}
                    onConfirm={() => setShowManualVerify(false)}
                    onReject={() => console.log('Reject')}
                />
            )}
        </div>
    );
};
