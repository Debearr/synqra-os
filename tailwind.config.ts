import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // NØID Brand Colors
        'matte-black': '#0A0A0A',
        'deep-charcoal': '#1A1A1A',
        'gold': '#D4AF37',
        'rose-gold': '#B76E79',
        'teal-neon': '#00FFF0',
        'electric-blue': '#0080FF',
        'silver-mist': '#C0C0C0',
        'crimson': '#DC143C',
        'sage': '#87CEEB',
        
        // Legacy support
        'brandGold': '#D4AF37',
        'brandCyan': '#00A1D6',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        accent: ['Playfair Display', 'serif'],
        
        // Legacy support
        playfair: ['"Playfair Display"', 'serif'],
        helvetica: ['"Helvetica Neue"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gold-pulse': 'goldPulse 2s ease-in-out infinite',
        'spin': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 240, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 240, 0.8)' }
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.8)' }
        },
        spin: {
          'to': { transform: 'rotate(360deg)' }
        }
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(0, 255, 240, 0.5)',
        'glow-teal-lg': '0 0 30px rgba(0, 255, 240, 0.8)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.5)',
        'glow-gold-lg': '0 0 30px rgba(212, 175, 55, 0.8)',
        'glow-crimson': '0 0 20px rgba(220, 20, 60, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    }
  },
  plugins: []
}

export default config
