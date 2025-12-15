"use client";

import React, { useState, useEffect } from "react";
import { buildExecSummary } from "@/features/executive-summary/execSummary.generator";
import { synqraExecSummaryData } from "@/features/executive-summary/execSummary.data.synqra";
import { execSummaryTokens as t } from "@/features/executive-summary/execSummary.tokens";
import type { ExecSummaryData } from "@/features/executive-summary/execSummary.types";
import { ExecutiveSummaryPage } from "@/features/executive-summary/ExecutiveSummaryPage";

export default function ExecSummaryStudio() {
  const [data, setData] = useState<ExecSummaryData>(synqraExecSummaryData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedVersions, setSavedVersions] = useState<{id: string, label: string, created_at: string}[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // Generic update helper
  const update = (key: keyof ExecSummaryData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePdfDownload = async () => {
      try {
        setIsGenerating(true);
        const response = await fetch("/api/exec-summary/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataOverride: data }),
        });
  
        if (!response.ok) throw new Error("PDF generation failed");
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "synqra-executive-summary.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error(error);
        alert("Failed to generate PDF");
      } finally {
        setIsGenerating(false);
      }
    };

  const handleSave = async () => {
      const label = prompt("Name this version:", `Version ${new Date().toLocaleTimeString()}`);
      if (!label) return;

      try {
          const res = await fetch("/api/exec-summary/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label, data }),
          });
          if (res.ok) {
              alert("Saved!");
              fetchVersions();
          } else {
            alert("Save failed");
          }
      } catch (e) {
          console.error(e);
          alert("Error saving");
      }
  };

  const fetchVersions = async () => {
      try {
          const res = await fetch("/api/exec-summary/list");
          if (res.ok) {
              const list = await res.json();
              setSavedVersions(list);
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleLoad = async (id: string) => {
      try {
          const res = await fetch(`/api/exec-summary/load?id=${id}`);
          if (res.ok) {
              const json = await res.json();
              if (json.data_json) {
                  setData(json.data_json);
                  setShowLoadMenu(false);
              }
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleReset = () => {
      if (confirm("Reset to default Synqra data?")) {
          setData(synqraExecSummaryData);
      }
  };

  useEffect(() => {
      fetchVersions();
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "100vh",
        background: "#000",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* LEFT EDITOR PANEL */}
      <aside
        style={{
          padding: "1.5rem",
          borderRight: `1px solid ${t.colors.border}`,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2
               style={{
                 fontSize: "1rem",
                 textTransform: "uppercase",
                 color: t.colors.accentSoft,
                 letterSpacing: "0.14em",
                 margin: 0,
               }}
             >
               Studio
             </h2>
        </div>

        {/* TOOLBAR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
             <StudioButton onClick={handleSave} label="Save Version" />
             <StudioButton onClick={() => setShowLoadMenu(!showLoadMenu)} label="Load..." />
             {showLoadMenu && (
                 <div style={{ 
                     gridColumn: '1 / -1', 
                     background: '#111', 
                     border: '1px solid #333', 
                     borderRadius: '4px',
                     padding: '0.5rem',
                     maxHeight: '200px',
                     overflowY: 'auto'
                 }}>
                     <div style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem'}}>SAVED VERSIONS</div>
                     {savedVersions.map(v => (
                         <div 
                            key={v.id} 
                            onClick={() => handleLoad(v.id)}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                borderBottom: '1px solid #222',
                            }}
                            className="hover:bg-neutral-800"
                         >
                             {v.label || v.created_at}
                         </div>
                     ))}
                     {savedVersions.length === 0 && <div style={{fontSize: '0.8rem', color: '#444'}}>No saves found</div>}
                 </div>
             )}
             <StudioButton onClick={handleReset} label="Reset Default" variant="secondary" />
             <StudioButton onClick={handlePdfDownload} label={isGenerating ? "Exporting..." : "Export PDF"} variant="accent" disabled={isGenerating} />
        </div>

        <hr style={{ borderColor: '#222', margin: 0 }} />

        {/* FIELD BLOCK COMPONENT */}
        <div>
            {(
            [
                ["brandName", "Brand Name"],
                ["productName", "Product Name"],
                ["tagline", "Tagline"],
                ["targetRaise", "Target Raise"],
                ["targetRaiseNote", "Raise Note"],
                ["targetRevenue", "Target Revenue"],
                ["targetRevenueNote", "Revenue Note"],
                ["overview", "Overview"],
                ["marketProblem", "Market Problem"],
                ["additionalRevenueNotes", "Revenue Notes Block"],
                ["whyNow", "Why Now"],
                ["founderBlurb", "Founder Blurb"],
                ["platformUrl", "Platform URL"],
                ["location", "Location"],
                ["status", "Status"],
                ["footerCta", "Footer Button"],
            ] as [keyof ExecSummaryData, string][]
            ).map(([field, label]) => (
            <FieldInput
                key={field}
                label={label}
                value={data[field] as any}
                onChange={(v) => update(field, v)}
            />
            ))}
        </div>
      </aside>

      {/* RIGHT LIVE PREVIEW PANEL */}
      <main
        style={{
          overflowY: "auto",
          height: "100vh",
        }}
      >
        <ExecutiveSummaryPage dataOverride={data} />
      </main>
    </div>
  );
}

/* ------------------------------
   SMALL REUSABLE COMPONENTS
--------------------------------*/
function StudioButton({ 
    label, 
    onClick, 
    variant = 'primary', 
    disabled = false 
}: { 
    label: string, 
    onClick: () => void, 
    variant?: 'primary' | 'secondary' | 'accent',
    disabled?: boolean
}) {
    const bg = variant === 'accent' ? t.colors.accent : variant === 'secondary' ? 'transparent' : '#222';
    const color = variant === 'accent' ? '#000' : variant === 'secondary' ? '#666' : '#eee';
    const border = variant === 'secondary' ? '1px solid #333' : 'none';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '0.5rem',
                background: bg,
                color: color,
                border: border,
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: disabled ? 'wait' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '100%'
            }}
        >
            {label}
        </button>
    )
}

function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          color: t.colors.textMuted,
          marginBottom: "0.35rem",
          letterSpacing: "0.14em",
        }}
      >
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          minHeight: "70px",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          background: t.colors.surface,
          color: t.colors.textPrimary,
          border: `1px solid ${t.colors.border}`,
          fontSize: "0.85rem",
          lineHeight: 1.4,
        }}
      />
    </div>
  );
}
