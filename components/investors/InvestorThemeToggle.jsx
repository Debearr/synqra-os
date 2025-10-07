"use client";
import React, { useState } from "react";

export default function ThemeToggle() {
  const [mode, setMode] = useState("luxury");

  function handleToggle() {
    const next = mode === "luxury" ? "progress" : "luxury";
    setMode(next);
    const token = next === "luxury" ? "investor" : "investor-dark";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", token);
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed top-6 right-6 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
    >
      {mode === "luxury" ? "Switch to Progress Mode" : "Switch to Luxury Mode"}
    </button>
  );
}
