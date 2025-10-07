"use client";
import React, { useEffect, useState } from "react";

export default function DemoPreviewBanner() {
  const [theme, setTheme] = useState("atelier");
  const [tier, setTier] = useState("Atelier");

  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem("ui_theme") : null;
    const savedTier = typeof window !== 'undefined' ? localStorage.getItem("current_tier") : null;
    if (savedTheme) setTheme(savedTheme);
    if (savedTier) setTier(savedTier);
  }, []);

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-lg border backdrop-blur bg-white/80 text-black data-[t=progress]:bg-gray-900/80 data-[t=progress]:text-white"
      data-t={theme}
    >
      <div className="text-sm">
        <span className="font-semibold">Demo Mode</span> — Theme:
        <span className="mx-1">{theme === "atelier" ? "Luxury Mode" : "Progress Mode"}</span> →
        <span className="ml-1">{tier}</span>
      </div>
    </div>
  );
}
