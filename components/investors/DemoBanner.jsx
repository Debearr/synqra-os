"use client";
import React, { useEffect, useState } from "react";

export default function DemoBanner() {
  const [theme, setTheme] = useState("investor");
  const version = "v1.0";

  useEffect(() => {
    if (typeof document !== "undefined") {
      const t = document.documentElement.getAttribute("data-theme") || "investor";
      setTheme(t);
    }
  }, []);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-2 text-sm rounded-xl shadow backdrop-blur-md bg-black/70 text-white font-medium">
      Investor Demo — {theme === "investor" ? "Luxury Mode" : "Progress Mode"} | Deck {version}
    </div>
  );
}
