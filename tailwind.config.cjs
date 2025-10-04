module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
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
