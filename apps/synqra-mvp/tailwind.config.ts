import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
    theme: {
      extend: {
        colors: {
          // LuxGrid canonical colors (source of truth)
          lux: {
            black: "#000000",
            gold: "#D4AF37",
            emerald: "#00D9A3",
            white: "#FFFFFF",
          },
          // Extended canonical tokens (normalized from existing usage)
          noir: {
            DEFAULT: "#0B0B0B",
            deep: "#0A0A0A",
          },
          gold: {
            DEFAULT: "#D4AF37",
            cta: "#C5A572",
          },
          ivory: {
            warm: "#F5F3F0",
          },
          accent: {
            teal: "#2DD4BF",
          },
          state: {
            error: "#EF4444",
          },
          // Legacy brand colors (aliases to canonical tokens for compatibility)
          brand: {
            bg: "#0B0B0B",    // Alias: noir.DEFAULT
            fg: "#EDEDED",
            gold: "#D4AF37",  // Alias: lux.gold
            teal: "#00FFC6",  // Distinct from accent.teal
            gray: "#A0A0A0",
            ink: "#141414",
            mute: "#F7F7F7",
          },
          indigo: "#4B52FF",
        },
        fontFamily: {
          display: ["ui-serif", "Georgia", "serif"],
          sans: [
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
          ],
          mono: ["ui-monospace", "Menlo", "Monaco", "Consolas", "monospace"],
        },
        borderRadius: {
          xl: "1.25rem",
        },
        boxShadow: {
          glow: "0 0 40px rgba(75, 82, 255, 0.45)",
        },
      },
    },
  plugins: [],
};

export default config;
