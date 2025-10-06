import React from "react";
import ThemeToggle from "@/components/settings/ThemeToggle";

export default function SettingsPage() {
  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      <h2 className="text-xl font-semibold">Appearance</h2>
      <ThemeToggle />
    </div>
  );
}
