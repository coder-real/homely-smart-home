export const colors = {
  bg: '#0A0A0F',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#E8E8ED',
  textDim: 'rgba(255,255,255,0.4)',
  textMuted: 'rgba(255,255,255,0.2)',

  accent: '#3B82F6',
  accentGlow: 'rgba(59,130,246,0.3)',

  green: '#22C55E',
  greenGlow: 'rgba(34,197,94,0.25)',

  amber: '#F59E0B',
  amberGlow: 'rgba(245,158,11,0.25)',

  warm: '#FBBF24',
  warmGlow: 'rgba(251,191,36,0.4)',

  red: '#EF4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  hero: 36,
} as const;

// Room-specific accent colors
export const roomColors = {
  living: { primary: colors.accent, glow: colors.accentGlow },
  bedroom: { primary: colors.warm, glow: colors.warmGlow },
  porch: { primary: colors.green, glow: colors.greenGlow },
} as const;
