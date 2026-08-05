import { Platform } from 'react-native';

// Display face: serif, business-like, high contrast — used for headers & brand.
// Body face: clean, neutral — used for running text & inputs.
export const fontFamily = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, "Times New Roman", serif',
    default: 'serif',
  }) as string,
  displayBold: Platform.select({
    ios: 'Georgia-Bold',
    android: 'serif',
    web: 'Georgia, "Times New Roman", serif',
    default: 'serif',
  }) as string,
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: '"Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }) as string,
  bodyMedium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    web: '"Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }) as string,
};

export const type = {
  brand: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    letterSpacing: 6,
    fontWeight: '600' as const,
  },
  h1: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    letterSpacing: 1.2,
    fontWeight: '600' as const,
  },
  h2: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    letterSpacing: 1,
    fontWeight: '600' as const,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    letterSpacing: 2.2,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    letterSpacing: 0.2,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    letterSpacing: 0.2,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: '400' as const,
  },
  button: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    letterSpacing: 1.8,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
};
