"use client";

import React, { useEffect, useState } from "react";
import Switch from "@/components/ui/switch";
import Label from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function ThemeToggle() {
  const [luxuryMode, setLuxuryMode] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ui_theme") : null;
    const initial = stored || "atelier";
    setLuxuryMode(initial === "atelier");
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  async function handleToggle(value) {
    setLuxuryMode(value);
    const mode = value ? "atelier" : "progress";
    if (typeof window !== "undefined") {
      localStorage.setItem("ui_theme", mode);
    }

    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        await supabase.from("profiles").update({ ui_theme: mode }).eq("id", user.id);
      }
    } catch (err) {
      console.error("Theme update error:", err);
    }

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", mode);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-2xl bg-neutral-50 dark:bg-neutral-900 shadow-sm">
      <Label htmlFor="theme-switch" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {luxuryMode ? "Luxury Mode (Atelier)" : "Progress Mode (Member Ladder)"}
      </Label>
      <Switch
        id="theme-switch"
        checked={luxuryMode}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-400"
      />
    </div>
  );
}
