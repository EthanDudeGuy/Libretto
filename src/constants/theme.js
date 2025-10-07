// Centralized design system for Libretto (Glassmorphism + Purple Gradient theme)
// Colors, spacing, typography, and component tokens for sophisticated literary companion
// Features: Glassmorphism effects, rich purple gradients, spoiler-free AI discussions

export const colors = {
  // Core Glassmorphism Backgrounds
  background: '#0f1419', // dark navy base
  backgroundGradient: ['#1a0b2e', '#16213e', '#0f1419'], // Rich purple gradient
  surface: 'rgba(255, 255, 255, 0.1)', // Glassmorphism surface
  surfaceElevated: 'rgba(255, 255, 255, 0.15)', // Elevated glass
  surfaceMuted: 'rgba(255, 255, 255, 0.05)', // Subtle glass
  overlay: 'rgba(26, 11, 46, 0.8)', // Purple overlay

  // Purple Gradient System
  purple: {
    primary: '#8b5cf6', // Main purple
    secondary: '#a855f7', // Lighter purple
    accent: '#c084fc', // Accent purple
    dark: '#6d28d9', // Dark purple
    light: '#e9d5ff', // Light purple
  },

  // Glassmorphism Effects
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    backdrop: 'rgba(255, 255, 255, 0.05)',
  },

  // Text (optimized for glassmorphism)
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textInverse: '#1a0b2e',

  // Accents (purple-based)
  accent: '#8b5cf6',
  accentHover: '#a855f7',
  accentMuted: 'rgba(139, 92, 246, 0.3)',
  outline: '#8b5cf6',

  // Borders (glassmorphism)
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',
  borderGlass: 'rgba(255, 255, 255, 0.15)',

  // Semantic (adapted for dark theme)
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
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
  // Glassmorphism Card System
  card: {
    backgroundColor: colors.glass.background,
    borderColor: colors.glass.border,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    // Glassmorphism backdrop blur (React Native implementation)
    backdropFilter: 'blur(20px)',
  },
  
  cardElevated: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
      elevation: 12,
    },
  },

  // Purple Gradient Buttons
  buttonPrimary: {
    backgroundColor: colors.purple.primary,
    backgroundDisabled: colors.accentMuted,
    textColor: '#fff',
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x3,
    shadow: {
      shadowColor: colors.purple.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  buttonSecondary: {
    backgroundColor: colors.glass.background,
    textColor: colors.textPrimary,
    borderColor: colors.purple.primary,
    borderWidth: 1,
    radius: radii.md,
    paddingV: spacing.x1_5,
    paddingH: spacing.x3,
  },

  // Glassmorphism Inputs
  input: {
    backgroundColor: colors.glass.backdrop,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    placeholder: colors.textMuted,
    textColor: colors.textPrimary,
    radius: radii.md,
    paddingV: spacing.x2,
    paddingH: spacing.x3,
  },

  // Book Card Specific (for library)
  bookCard: {
    backgroundColor: colors.glass.background,
    borderColor: colors.glass.border,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x3,
    shadow: {
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
  },

  // Chat Interface
  chatBubble: {
    backgroundColor: colors.glass.background,
    borderColor: colors.glass.border,
    borderWidth: 1,
    radius: radii.lg,
    padding: spacing.x2_5,
    shadow: {
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  },

  // Progress Bars
  progressBar: {
    backgroundColor: colors.glass.backdrop,
    progressColor: colors.purple.primary,
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
  
  // Glassmorphism specific animations
  glassHover: {
    backgroundColor: colors.surfaceElevated,
    duration: 200,
  },
  
  glassPress: {
    backgroundColor: colors.surfaceMuted,
    scale: 0.98,
    duration: 100,
  },
};

// Gradient definitions for backgrounds
export const gradients = {
  primary: ['#1a0b2e', '#16213e', '#0f1419'],
  purple: ['#8b5cf6', '#a855f7', '#c084fc'],
  accent: ['#6d28d9', '#8b5cf6', '#a855f7'],
  subtle: ['rgba(139, 92, 246, 0.1)', 'rgba(168, 85, 247, 0.05)'],
};

const theme = { 
  colors, 
  spacing, 
  radii, 
  typography, 
  components, 
  animations, 
  gradients 
};
export default theme;


