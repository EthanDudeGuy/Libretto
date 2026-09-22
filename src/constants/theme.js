// Centralized design system for Libretto (Neutral Dark Literary theme)
// Colors, spacing, typography, and component tokens for sophisticated literary companion
// Features: neutral charcoal surfaces (not brown/beige) with tonal depth, a warm
// orange action accent, a muted sand tone reserved for selective editorial
// accents, and a quiet sage secondary accent for informational content.

export const colors = {
  // Neutral charcoal surfaces — 4 close, low-contrast levels for depth without
  // turning into a field of competing rectangles. Each level is only a touch
  // lighter than the one below it.
  // level0 background (page) -> level1 surface (panels/sections) -> level2
  // surfaceElevated (cards, inputs) -> level3 surfaceOverlay (dropdowns, modals).
  background: '#141412', // Very dark neutral charcoal base
  backgroundGradient: ['#141412', '#171714'], // Subtle neutral dark gradient
  surface: '#1b1b18', // Level 1 — panels/sections, slightly lighter than background
  surfaceElevated: '#22221e', // Level 2 — cards, only subtly lighter than surface
  surfaceOverlay: '#292925', // Level 3 — dropdowns, modals, popovers (topmost)
  surfaceMuted: 'rgba(242, 240, 233, 0.04)', // Subtle neutral glass wash
  overlay: 'rgba(10, 10, 9, 0.85)', // Neutral dark modal backdrop

  // Glassmorphism Effects (neutral, low-contrast for dark theme)
  glass: {
    background: 'rgba(242, 240, 233, 0.05)',
    border: 'rgba(242, 240, 233, 0.10)',
    shadow: 'rgba(10, 10, 9, 0.3)',
    backdrop: 'rgba(242, 240, 233, 0.02)',
  },

  // Text — warm white primary, neutral grays beneath it (not brown-tinted)
  textPrimary: '#f2f0e9', // Warm white
  textSecondary: '#b8b6ad', // Neutral muted gray
  textMuted: '#85847d', // Darker neutral gray
  textInverse: '#141412',

  // Sand/paper tone — a SELECTIVE editorial accent (headings, metadata,
  // selected states, book-related context), inspired by physical books and
  // paper. Not for backgrounds, borders, or general UI text.
  sand: '#c9bfa8',
  sandMuted: 'rgba(201, 191, 168, 0.15)',
  sandDark: '#a89873',

  // Accent — warm orange, the primary interactive color. Reserved for active
  // states, progress, and important actions; not for general decoration.
  accent: '#e8892d',
  accentHover: '#f0a050',
  accentMuted: 'rgba(232, 137, 45, 0.28)',
  outline: '#e8892d',

  // Borders — neutral and low-contrast; used sparingly
  borderSubtle: 'rgba(242, 240, 233, 0.06)',
  borderStrong: 'rgba(242, 240, 233, 0.12)',
  borderGlass: 'rgba(242, 240, 233, 0.08)',

  // Orange Color System (primary accent color)
  orange: '#e8892d', // Primary orange accent
  orangeMuted: 'rgba(232, 137, 45, 0.28)', // Muted orange
  orangeDark: '#be6e1e', // Darker orange
  orangeLight: '#f0a050', // Lighter orange

  // Sage Color System (secondary accent, for informational/contextual content
  // only — kept very subtle so it reads as quiet, not decorative)
  sage: '#87947a',
  sageMuted: 'rgba(135, 148, 122, 0.20)',
  sageDark: '#69765d',
  sageLight: '#a3af97',

  // Semantic (adapted for neutral dark theme)
  success: '#7ca36e',
  warning: '#d9a441',
  danger: '#c0584a',
  info: '#87947a',
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
  // Dark Card System — cards sit only subtly above the surface they're on,
  // so borders are low-contrast and shadows do most of the separation work.
  card: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: '#0a0a09',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  cardElevated: {
    backgroundColor: colors.surfaceOverlay,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: '#0a0a09',
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
    textColor: '#fdf6ec',
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x3,
    shadow: {
      shadowColor: '#0a0a09',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
  },

  // Floating dropdown/popover menus (e.g. AppHeader's account menu,
  // BookChat's status menu). Any new dropdown should reuse these tokens —
  // see the "Dropdown menus" rule in CLAUDE.md.
  dropdown: {
    card: {
      backgroundColor: colors.surfaceOverlay,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      paddingVertical: spacing.x0_5,
      paddingHorizontal: spacing.x0_5,
      shadow: {
        shadowColor: '#0a0a09',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.38,
        shadowRadius: 18,
        elevation: 12,
      },
    },
    item: {
      borderRadius: radii.sm,
      paddingVertical: 6,
      paddingHorizontal: spacing.x1,
    },
    itemText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.textPrimary,
    },
    divider: {
      backgroundColor: colors.borderSubtle,
      marginVertical: 3,
      marginHorizontal: spacing.x1,
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
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: '#0a0a09',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
  },

  // Chat Interface
  chatBubble: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x2_5,
    shadow: {
      shadowColor: '#0a0a09',
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
  primary: ['#141412', '#171714'],
  accent: ['#e8892d', '#f0a050'],
  subtle: ['rgba(232, 137, 45, 0.1)', 'rgba(240, 160, 80, 0.05)'],
  sage: ['rgba(135, 148, 122, 0.12)', 'rgba(135, 148, 122, 0.04)'],
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
