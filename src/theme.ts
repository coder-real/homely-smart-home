export const colors = {
  // Brand
  primary: '#046FD9',
  primaryLight: '#3B8EFF',
  primaryDark: '#0355B0',
  primaryGlow: 'rgba(4,111,217,0.25)',

  accent: '#DAFC0E',
  accentDim: '#B8D60C',
  accentGlow: 'rgba(218,252,14,0.2)',

  // Amber — ON state for room cards/toggles
  amber: '#F59E0B',
  amberDim: '#D97706',
  amberGlow: 'rgba(245,158,11,0.2)',
  amberBorder: '#F59E0B',

  // Backgrounds
  bg: '#0A0D14',
  bgCard: '#131722',
  bgCardHover: '#181E2B',
  bgElevated: '#0E1420',
  bgInput: '#181D29',
  bgHero: 'rgba(0,0,0,0.45)',
  bgSheet: '#12161F',

  // Borders
  border: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.14)',
  borderFocus: 'rgba(4,111,217,0.6)',
  borderAmber: '#F59E0B',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successGlow: 'rgba(16,185,129,0.2)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245,158,11,0.2)',
  error: '#EF4444',
  errorGlow: 'rgba(239,68,68,0.2)',

  // Room-specific accents
  roomLiving: '#38BDF8',
  roomBedroom: '#A855F7',
  roomPorch: '#F59E0B',
  roomLivingGlow: 'rgba(56,189,248,0.2)',
  roomBedroomGlow: 'rgba(168,85,247,0.15)',
  roomPorchGlow: 'rgba(245,158,11,0.2)',

  // Tab bar
  tabActive: '#F8FAFC',
  tabInactive: '#64748B',
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

// Modern rounded corners
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 44,
} as const;

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
