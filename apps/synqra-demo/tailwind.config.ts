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
          brand: {
            bg: "#0B0B0B",
            fg: "#EDEDED",
            gold: "#D4AF37",
            teal: "#00FFC6",
            gray: "#A0A0A0",
            ink: "#141414",
            mute: "#F7F7F7",
          },
          noir: "#0B0B0B",
          indigo: "#4B52FF",
          lux: {
            black: "#000000",
            gold: "#D4AF37",
            emerald: "#00D9A3",
            white: "#FFFFFF",
          },
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
