export const colors = {
  matteBlack: '#0A0A0A',
  deepCharcoal: '#1A1A1A',
  gold: '#D4AF37',
  roseGold: '#B76E79',
  tealNeon: '#00FFF0',
  electricBlue: '#0080FF',
  silverMist: '#C0C0C0',
  crimson: '#DC143C',
  sage: '#87CEEB',
} as const;

export const typography = {
  fontFamily: {
    heading: ['Montserrat', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    accent: ['Playfair Display', 'serif'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export const motion = {
  transition: {
    fast: '0.15s ease-in-out',
    base: '0.3s ease-in-out',
    slow: '0.5s ease-in-out',
  },
  animation: {
    glowPulse: '2s ease-in-out infinite',
    fadeIn: '0.5s ease-in-out',
    slideUp: '0.5s ease-out',
  },
} as const;

export type Theme = {
  colors: typeof colors;
  typography: typeof typography;
  motion: typeof motion;
};

export const theme: Theme = { colors, typography, motion };
