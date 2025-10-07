// Centralized design system for Libretto (Dark Navy theme)
// Colors, spacing, typography, and component tokens
// Reference: See STYLE_GUIDE.md for the full design specification and CSS variables

export const colors = {
  // Core
  background: '#0f1419', // dark navy
  surface: '#131a21',
  surfaceElevated: '#17202a',
  overlay: 'rgba(2, 6, 12, 0.7)',

  // Text
  textPrimary: '#e6edf3',
  textSecondary: '#c9d1d9',
  textMuted: 'rgba(201, 209, 217, 0.65)',
  textInverse: '#0f1419',

  // Accents
  blue: '#ee6c4d',
  blueHover: '#ee6c4d',
  blueMuted: '#ee6c4d',
  outline: '#ee6c4d',

  // Borders
  borderSubtle: 'rgba(230, 237, 243, 0.08)',
  borderStrong: 'rgba(230, 237, 243, 0.14)',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const spacing = {
  x0_5: 4,
  x1: 8,
  x1_5: 12,
  x2: 16,
  x2_5: 20,
  x3: 24,
  x4: 32,
  x5: 40,
  x6: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  fontFamily: 'Inter_400Regular',
  fontFamilyMedium: 'Inter_500Medium',
  fontFamilySemibold: 'Inter_600SemiBold',
  fontFamilyBold: 'Inter_700Bold',
  // Sizes (based on 8px grid)
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  h1: 32,
  h2: 24,
  h3: 20,
  lineTight: 18,
  lineBase: 22,
  lineRelaxed: 26,
};

export const components = {
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x2,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  buttonPrimary: {
    backgroundColor: colors.blue,
    backgroundDisabled: 'rgba(66, 133, 244, 0.4)',
    textColor: '#fff',
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x2,
  },
  buttonSecondary: {
    backgroundColor: colors.blueMuted,
    textColor: colors.textPrimary,
    borderColor: colors.outline,
    borderWidth: 1,
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x2,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    placeholder: 'rgba(201, 209, 217, 0.5)',
    textColor: colors.textPrimary,
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x2,
  },
};

const theme = { colors, spacing, radii, typography, components };
export default theme;


