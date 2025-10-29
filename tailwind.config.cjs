module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'matte-black': '#0A0A0A',
        'deep-charcoal': '#1A1A1A',
        'gold': '#D4AF37',
        'rose-gold': '#B76E79',
        'teal-neon': '#00FFF0',
        'electric-blue': '#0080FF',
        'silver-mist': '#C0C0C0',
        'crimson': '#DC143C',
        'sage': '#87CEEB',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        accent: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 240, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 240, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
