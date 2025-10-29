/**
 * NØID/Synqra Brand Theme Configuration
 * Luxury automation platform with street-premium aesthetics
 */

export const colors = {
  // Core Identity
  matteBlack: '#0A0A0A',      // Primary background
  deepCharcoal: '#1A1A1A',    // Secondary surfaces
  gold: '#D4AF37',            // Luxury accent
  roseGold: '#B76E79',        // Premium highlight
  tealNeon: '#00FFF0',        // Digital pulse
  electricBlue: '#0080FF',    // Energy accent
  silverMist: '#C0C0C0',      // Text primary
  crimson: '#DC143C',         // Alert/emphasis
  sage: '#87CEEB'             // Calm accent
} as const;

export const typography = {
  fontFamily: {
    heading: ['Montserrat', 'sans-serif'],  // Bold 700
    body: ['Inter', 'sans-serif'],          // 400-600
    accent: ['Playfair Display', 'serif']   // Bold 700
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem'  // 36px
  }
} as const;

export const motion = {
  transition: {
    fast: '0.15s ease-in-out',
    base: '0.3s ease-in-out',
    slow: '0.5s ease-in-out'
  },
  animation: {
    glowPulse: '2s ease-in-out infinite',
    fadeIn: '0.5s ease-in-out',
    slideUp: '0.5s ease-out'
  }
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem'    // 64px
} as const;

export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px'
} as const;

export const shadows = {
  glow: {
    teal: '0 0 20px rgba(0, 255, 240, 0.5)',
    tealIntense: '0 0 30px rgba(0, 255, 240, 0.8)',
    gold: '0 0 20px rgba(212, 175, 55, 0.5)',
    goldIntense: '0 0 30px rgba(212, 175, 55, 0.8)'
  },
  elevation: {
    low: '0 2px 8px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.4)',
    high: '0 8px 32px rgba(0, 0, 0, 0.5)'
  }
} as const;

// Glassmorphism effect
export const glassmorphism = {
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
} as const;
