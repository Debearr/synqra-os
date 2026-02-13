import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      "ds-gold": "var(--ds-gold)",
      "ds-bg": "var(--ds-bg)",
      "ds-surface": "var(--ds-surface)",
      "ds-text-primary": "var(--ds-text-primary)",
      "ds-text-secondary": "var(--ds-text-secondary)",
    },
    spacing: {
      0: "0",
      2: "0.5rem",
      4: "1rem",
      6: "1.5rem",
      8: "2rem",
      12: "3rem",
      16: "4rem",
    },
    borderRadius: {
      none: "0",
      sm: "2px",
      DEFAULT: "4px",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
    },
    lineHeight: {
      compact: "1.4",
      copy: "1.5",
    },
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      maxWidth: {
        "3xl": "48rem",
        "4xl": "56rem",
        journey: "42.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
