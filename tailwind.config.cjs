module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // NØID Brand DNA Colors
        midnightBlack: "#0B0B0B",
        goldFoil: "#D4AF37",
        neonTeal: "#00FFC6",
        softGray: "#A0A0A0",
        // Legacy colors
        brandGold: "#D4AF37",
        brandCyan: "#00A1D6"
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        helvetica: ['"Helvetica Neue"', 'sans-serif']
      }
    }
  },
  plugins: []
};
