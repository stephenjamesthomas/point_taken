// Design System Constants
// Creative, modern design system with vibrant colors and depth

export const Colors = {
  // Primary Colors - Vibrant gradient palette
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryGradient: ['#6366F1', '#8B5CF6'], // Indigo to Purple
  
  // Secondary Colors
  secondary: '#EC4899', // Pink
  secondaryDark: '#DB2777',
  secondaryLight: '#F472B6',
  secondaryGradient: ['#EC4899', '#F59E0B'], // Pink to Amber
  
  // Accent Colors
  accent: '#F59E0B', // Amber
  accentDark: '#D97706',
  accentLight: '#FBBF24',
  accentGradient: ['#F59E0B', '#EF4444'], // Amber to Red
  
  // Semantic Colors - More vibrant
  success: '#10B981', // Emerald
  successLight: '#D1FAE5',
  successGradient: ['#10B981', '#059669'],
  error: '#EF4444', // Red
  errorLight: '#FEE2E2',
  errorGradient: ['#EF4444', '#DC2626'],
  warning: '#F59E0B', // Amber
  warningLight: '#FEF3C7',
  info: '#3B82F6', // Blue
  infoLight: '#DBEAFE',
  
  // Neutral Colors - Warmer, richer tones
  background: '#1A1F2E', // Deep slate with slight blue tint
  backgroundLight: '#252B3D',
  surface: '#252B3D', // Slate
  surfaceSecondary: '#2D3447',
  surfaceElevated: '#3A4154',
  
  // Text Colors - High contrast
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textDisabled: '#64748B',
  
  // Border Colors
  border: '#334155',
  borderLight: '#475569',
  divider: '#334155',
  
  // Shadow Colors - More dramatic
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  shadowColored: 'rgba(99, 102, 241, 0.3)',
  
  // Avatar Colors - Vibrant palette
  avatarColors: [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
    '#8B5CF6', '#EC4899', '#F472B6', '#14B8A6', '#06B6D4',
  ],
  
  // Glass effect
  glass: 'rgba(30, 41, 59, 0.7)',
  glassLight: 'rgba(30, 41, 59, 0.5)',
};

export const Typography = {
  // Font Sizes - Slightly larger for impact
  h1: 36,
  h2: 30,
  h3: 26,
  h4: 22,
  h5: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  
  // Line Heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
  
  // Letter Spacing
  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  colored: {
    shadowColor: Colors.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Common component styles
export const CommonStyles = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardElevated: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.colored,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  inputFocused: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    ...Shadows.colored,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.md,
  },
};

// Gradient helper function (for use with LinearGradient component)
export const getGradientColors = (type: 'primary' | 'secondary' | 'accent' | 'success' | 'error') => {
  const gradients = {
    primary: Colors.primaryGradient,
    secondary: Colors.secondaryGradient,
    accent: Colors.accentGradient,
    success: Colors.successGradient,
    error: Colors.errorGradient,
  };
  return gradients[type] || gradients.primary;
};
