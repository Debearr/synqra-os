"use client";

import * as React from "react";
import { theme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Expose theme on window for quick debugging (dev only)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__SYNQRA_THEME__ = theme;
  }
  return <>{children}</>;
}

export default ThemeProvider;
