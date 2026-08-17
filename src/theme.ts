export const colors = {
  // Brand
  primary: '#046FD9',
  primaryLight: '#3B8EFF',
  primaryDark: '#0355B0',
  primaryGlow: 'rgba(4,111,217,0.25)',

  accent: '#DAFC0E',
  accentDim: '#B8D60C',
  accentGlow: 'rgba(218,252,14,0.2)',

  // Backgrounds
  bg: '#080C14',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.06)',
  bgElevated: '#0E1420',
  bgInput: 'rgba(255,255,255,0.06)',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  borderFocus: 'rgba(4,111,217,0.5)',

  // Text
  text: '#F0F2F5',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#34D399',
  successGlow: 'rgba(52,211,153,0.2)',
  warning: '#FBBF24',
  warningGlow: 'rgba(251,191,36,0.2)',
  error: '#F87171',
  errorGlow: 'rgba(248,113,113,0.2)',

  // Room-specific
  roomLiving: '#3B8EFF',
  roomBedroom: '#FBBF24',
  roomPorch: '#34D399',
  roomLivingGlow: 'rgba(59,142,255,0.2)',
  roomBedroomGlow: 'rgba(251,191,36,0.15)',
  roomPorchGlow: 'rgba(52,211,153,0.15)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
