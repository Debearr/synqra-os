/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'noid-black': '#0B0B0B',
        'noid-charcoal': '#141414',
        'noid-charcoal-light': '#1E1E1E',
        'noid-white': '#F5F5F5',
        'noid-silver': '#9FA4B2',
        'noid-gold': '#D4AF37',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.25)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F9E7A5 100%)',
      },
    },
  },
  plugins: [],
}
