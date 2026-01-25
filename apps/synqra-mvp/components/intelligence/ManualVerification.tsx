
import React, { useState } from 'react';
import { Check, Edit2, Eye, AlertTriangle } from 'lucide-react';
import { ExtractionData, VisualExtraction } from './types';

interface ManualVerificationProps {
    sourceUrl: string;
    initialData: ExtractionData;
    onConfirm: (data: ExtractionData) => void;
    onReject: () => void;
}

const LUX_GOLD = '#D4AF37';

export const ManualVerificationScreen: React.FC<ManualVerificationProps> = ({
    sourceUrl,
    initialData,
    onConfirm,
    onReject,
}) => {
    const [data, setData] = useState<ExtractionData>(initialData);
    const [editingField, setEditingField] = useState<string | null>(null);

    const globalConfidence = data.meta.confidence;

    // Helper to update field
    const updateField = (path: string, val: any) => {
        console.log(`Update ${path}`, val);
    };

    const renderInputOrValue = (label: string, value: string | number, confidence: number, path: string) => {
        const isLowConf = confidence < 0.8;
        const isEditing = editingField === path;

        return (
            <div
                className={`p-3 rounded border transition-all ${isLowConf ? 'border-amber-500/40 bg-amber-900/10' : 'border-white/5 bg-white/5'} ${isEditing ? 'ring-1 ring-brand-teal' : ''} mb-2`}
                onClick={() => setEditingField(path)}
            >
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase text-brand-gray">{label}</span>
                    <span className={`text-[10px] font-mono ${isLowConf ? 'text-amber-500' : 'text-brand-teal'}`}>
                        {(confidence * 100).toFixed(0)}%
                    </span>
                </div>
                {isEditing ? (
                    <input
                        className="w-full bg-transparent text-sm text-brand-fg focus:outline-none border-b border-brand-teal"
                        defaultValue={value}
                        onBlur={(e) => {
                            updateField(path, e.target.value);
                            setEditingField(null);
                        }}
                        autoFocus
                    />
                ) : (
                    <div className="text-sm font-medium text-brand-fg flex items-center justify-between">
                        {value}
                        <Edit2 className="w-3 h-3 text-white/10 opacity-0 group-hover:opacity-100" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-[#0A0A0A] font-sans">
            {/* LEFT: Source Asset & Image Normalization Preview */}
            <div className="w-1/2 h-full border-r border-white/10 relative overflow-hidden bg-black flex flex-col">
                <div className="flex-1 relative flex items-center justify-center p-8">
                    <img src={sourceUrl} className="object-contain max-w-full max-h-full opacity-90 shadow-2xl" alt="Source" />
                </div>

                {/* Raw OCR Preview Pane */}
                <div className="h-1/3 border-t border-white/10 bg-[#050505] p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-3 text-brand-teal uppercase tracking-widest text-[10px] font-bold">
                        <Eye className="w-3 h-3" /> Raw OCR Detection
                    </div>
                    <p className="font-mono text-xs text-brand-gray/80 leading-relaxed whitespace-pre-wrap">
                        {data.data.visual.detectedText || "No readable text detected in source."}
                    </p>
                </div>
            </div>

            {/* RIGHT: Complex Extraction Form */}
            <div className="w-1/2 h-full flex flex-col bg-[#0A0A0A]">
                {/* Header with Trigger Logic Visuals */}
                <div className="p-6 border-b border-white/10 bg-[#0A0A0A]">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="font-display text-2xl text-brand-fg">Manual Verification</h2>
                            <p className="text-xs text-white/40 font-mono mt-1">ID: {data.meta.id}</p>

                            {/* Trigger Reasons */}
                            {data.meta.triggerReason && data.meta.triggerReason.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {data.meta.triggerReason.map(reason => (
                                        <span key={reason} className="px-2 py-0.5 bg-amber-900/30 border border-amber-500/30 text-amber-500 text-[9px] uppercase tracking-wide rounded">
                                            {reason}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Global Confidence</span>
                            <span className="text-3xl font-display font-bold" style={{ color: LUX_GOLD }}>
                                {(globalConfidence * 100).toFixed(0)}%
                            </span>
                            {globalConfidence < 0.85 && (
                                <div className="flex items-center justify-end gap-1 text-amber-500 text-[10px] mt-1">
                                    <AlertTriangle className="w-3 h-3" /> Below Threshold (0.85)
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Vibe Section */}
                    <section>
                        <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3 font-display border-b border-white/5 pb-1">Vibe Analysis</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInputOrValue("Primary Vibe", data.data.visual.vibe.primary, data.data.visual.vibe.confidence, "visual.vibe.primary")}
                            {renderInputOrValue("Secondary Vibe", data.data.visual.vibe.secondary, data.data.visual.vibe.confidence * 0.9, "visual.vibe.secondary")}
                        </div>
                    </section>

                    {/* Typography Section */}
                    <section>
                        <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3 font-display border-b border-white/5 pb-1">Typography</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInputOrValue("Font Name", data.data.visual.typography.detectedFontName, data.data.visual.typography.confidence, "visual.typography.detectedFontName")}
                            {renderInputOrValue("Class", data.data.visual.typography.isSerif ? "Serif" : "Sans-Serif", data.data.visual.typography.confidence, "visual.typography.isSerif")}
                        </div>
                    </section>

                    {/* Colors Section */}
                    <section>
                        <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3 font-display border-b border-white/5 pb-1">Brand Palette</h3>
                        <div className="space-y-2">
                            {data.data.visual.brandColors.map((color, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 border border-white/5 rounded bg-white/[0.02]">
                                    <div className="w-8 h-8 rounded border border-white/20" style={{ backgroundColor: color.hex }} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-brand-fg font-medium">{color.name}</span>
                                            <span className="text-[10px] font-mono text-brand-teal">{(color.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="text-[10px] text-white/30 font-mono uppercase">{color.hex}</div>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-2 border border-dashed border-white/10 rounded text-xs text-white/30 hover:text-brand-teal hover:border-brand-teal transition-colors">
                                + Add Color
                            </button>
                        </div>
                    </section>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md flex justify-end gap-3 transition-colors">
                    <button onClick={onReject} className="px-6 py-3 text-sm text-brand-gray hover:text-white border border-transparent hover:border-white/10 rounded">
                        Reject Extraction
                    </button>
                    <button onClick={() => onConfirm(data)} className="px-8 py-3 bg-white/5 border border-brand-teal/50 text-brand-teal rounded text-sm font-bold tracking-wide hover:bg-brand-teal/10 flex items-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                        <Check className="w-4 h-4" /> CONFIRM & RETRAIN
                    </button>
                </div>
            </div>
        </div>
    );
};
