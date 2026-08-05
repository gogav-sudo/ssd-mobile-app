// СД — Секьюрити Сервис Делюкс
// Core design tokens. Never hardcode colors in screens — always import from here.

export const colors = {
  // Base surfaces
  background: '#0B0B0C',
  surface: '#16171A',
  surfaceRaised: '#1D1E22',
  surfaceSunken: '#080809',
  border: '#2A2B2F',
  borderSubtle: '#1F2023',

  // Accent — warm gold, never bright yellow
  gold: '#C9A24B',
  goldDim: '#8F7333',
  goldMuted: 'rgba(201, 162, 75, 0.16)',
  goldBorder: 'rgba(201, 162, 75, 0.35)',

  // Typography
  textPrimary: '#F3F1EC',
  textSecondary: '#A9A7A0',
  textTertiary: '#6E6D68',
  textOnGold: '#0B0B0C',

  // Semantic — kept separate from accent
  success: '#4C8B63',
  successMuted: 'rgba(76, 139, 99, 0.16)',
  warning: '#C97A3D',
  warningMuted: 'rgba(201, 122, 61, 0.16)',
  error: '#B4483F',
  errorMuted: 'rgba(180, 72, 63, 0.16)',

  // Utility
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof colors;
