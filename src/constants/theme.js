// Centralized design system for Libretto (Dark UI + Coral Accent theme)
// Colors, spacing, typography, and component tokens for sophisticated literary companion
// Features: Dark near-black backgrounds, coral/orange accents, horizontal book cards, spoiler-free AI discussions

export const colors = {
  // Dark UI Backgrounds (near-black base)
  background: '#1a1a1a', // Near-black base
  backgroundGradient: ['#1a1a1a', '#1f1f1f'], // Subtle dark gradient
  surface: '#242424', // Dark cards
  surfaceElevated: '#2d2d2d', // Elevated elements
  surfaceMuted: 'rgba(255, 255, 255, 0.05)', // Subtle glass
  overlay: 'rgba(0, 0, 0, 0.85)', // Dark modal overlay

  // Glassmorphism Effects (updated for dark theme)
  glass: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    backdrop: 'rgba(255, 255, 255, 0.03)',
  },

  // Text (restored from working theme)
  textPrimary: '#e6edf3', // Soft white (was working well)
  textSecondary: '#c9d1d9', // Muted white (was working well)
  textMuted: 'rgba(201, 209, 217, 0.65)', // Properly muted (was working well)
  textInverse: '#0f1419',

  // Accents (coral/orange-based)
  accent: '#fe8a1f',
  accentHover: '#ff9f40',
  accentMuted: 'rgba(254, 138, 31, 0.3)',
  outline: '#fe8a1f',

  // Borders (updated for dark theme)
  borderSubtle: 'rgba(255, 255, 255, 0.08)', // Subtle border for dark theme
  borderStrong: 'rgba(255, 255, 255, 0.15)', // Strong border for dark theme
  borderGlass: 'rgba(255, 255, 255, 0.12)',

  // Orange Color System (primary accent color)
  orange: '#fe8a1f', // Primary orange/coral color
  orangeMuted: 'rgba(254, 138, 31, 0.3)', // Muted orange
  orangeDark: '#e67e00', // Darker orange
  orangeLight: '#ff9f40', // Lighter orange

  // Legacy Blue Colors (deprecated - use orange instead)
  blue: '#fe8a1f', // Same as orange - kept for backward compatibility
  blueMuted: 'rgba(254, 138, 31, 0.3)', // Same as orangeMuted
  blueDark: '#e67e00', // Same as orangeDark
  blueLight: '#ff9f40', // Same as orangeLight

  // Semantic (adapted for dark theme)
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#fe8a1f',
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
  // Dark Card System
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  cardElevated: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },

  // Coral/Orange Buttons
  buttonPrimary: {
    backgroundColor: colors.orange,
    backgroundDisabled: colors.accentMuted,
    textColor: '#fff',
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x3,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    textColor: colors.textPrimary,
    borderColor: colors.orange,
    borderWidth: 1,
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x3,
  },

  // Dark Inputs
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    placeholder: colors.textMuted,
    textColor: colors.textPrimary,
    radius: radii.md,
    paddingV: spacing.x2,
    paddingH: spacing.x3,
  },

  // Horizontal Book Card (for library)
  horizontalBookCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
  },

  // Chat Interface
  chatBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x2_5,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
  },

  // Progress Bars
  progressBar: {
    backgroundColor: colors.surfaceElevated,
    progressColor: colors.orange,
    radius: radii.pill,
    height: 8,
  },
};

// Animation and Transition System
export const animations = {
  // Timing functions
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  // Easing curves
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    spring: 'spring',
  },

  // Common animations
  fadeIn: {
    opacity: 1,
    duration: 300,
  },

  fadeOut: {
    opacity: 0,
    duration: 200,
  },

  slideUp: {
    translateY: 0,
    duration: 300,
  },

  slideDown: {
    translateY: 20,
    duration: 300,
  },

  scale: {
    scale: 1,
    duration: 200,
  },

  // Dark theme specific animations
  cardHover: {
    backgroundColor: colors.surfaceElevated,
    duration: 200,
  },

  cardPress: {
    backgroundColor: colors.surfaceMuted,
    scale: 0.98,
    duration: 100,
  },
};

// Gradient definitions for backgrounds
export const gradients = {
  primary: ['#1a1a1a', '#1f1f1f'],
  accent: ['#fe8a1f', '#ff9f40'],
  subtle: ['rgba(254, 138, 31, 0.1)', 'rgba(255, 159, 64, 0.05)'],
};

const theme = {
  colors,
  spacing,
  radii,
  typography,
  components,
  animations,
  gradients,
};
export default theme;
