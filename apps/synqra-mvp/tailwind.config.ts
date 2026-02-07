import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NØID BRAND TOKENS (LOCKED)
        noid: {
          black: "#050505", // Void
          gold: {
            DEFAULT: "#D4AF37",
            dim: "#D4AF37",
          },
          silver: {
            DEFAULT: "#C0C0C0",
            dark: "#3A3A3C",    // Dark Silver (Subtle borders)
          },
          teal: {
            DEFAULT: "#00D2BE", // Cyber Teal (Intelligence/Signal)
            glow: "rgba(0, 210, 190, 0.35)", // For box-shadows (Command Center only)
          },
        },
        // MAPPING TO SHADCN SEMANTICS
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "var(--noid-teal)",
        background: "#050505",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#D4AF37",
          foreground: "#050505",
        },
        secondary: {
          DEFAULT: "#3A3A3C",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF453A",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1C1C1E",
          foreground: "#8C8C91",
        },
        accent: {
          DEFAULT: "#1C1C1E",
          foreground: "#C5A059",
        },
      },
      // EXTENDED UTILITIES
      boxShadow: {
        'teal-glow': '0 0 20px -5px rgba(0, 210, 190, 0.35)',
        'gold-glow': '0 0 20px -5px rgba(212, 175, 55, 0.35)',
      },
      backgroundImage: {
        'brushed-metal': "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        "geological-drift": {
          "0%, 100%": { transform: "scale(1) translate(0,0) rotate(0deg)" },
          "50%": { transform: "scale(1.1) translate(-2%, 1%) rotate(1deg)" },
        },
      },
      animation: {
        "geological-drift": "geological-drift var(--flow-speed) ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
