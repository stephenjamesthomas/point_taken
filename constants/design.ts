// Design System Constants
// Modern mobile app design system following iOS and Material Design principles

export const Colors = {
  // Primary Colors
  primary: '#007AFF', // iOS Blue
  primaryDark: '#0051D5',
  primaryLight: '#E3F2FD',
  
  // Secondary Colors
  secondary: '#5856D6', // Purple
  accent: '#FF9500', // Orange
  
  // Semantic Colors
  success: '#34C759', // Green
  successLight: '#E8F5E9',
  error: '#FF3B30', // Red
  errorLight: '#FFEBEE',
  warning: '#FF9500', // Orange
  info: '#5AC8FA', // Light Blue
  
  // Neutral Colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F7',
  
  // Text Colors
  textPrimary: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#86868B',
  textDisabled: '#C7C7CC',
  
  // Border Colors
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  divider: '#E5E5EA',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Avatar Colors (keeping existing palette)
  avatarColors: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  ],
};

export const Typography = {
  // Font Sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  
  // Line Heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Common component styles
export const CommonStyles = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
};

