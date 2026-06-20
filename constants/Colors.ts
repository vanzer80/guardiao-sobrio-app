export const Colors = {
  bg: '#0e0d0c',
  surface: '#141312',
  surfaceRaised: '#1a1917',

  text: '#e8e6e2',
  muted: '#8a8782',
  mutedDark: '#524f4c',
  mutedLight: '#a8a39c',

  gold: '#c8a84b',
  goldDim: '#a68a3a',
  emergency: '#e07b2a',
  emergencyDim: '#b85f1f',

  success: '#4a7c59',
  danger: '#8b2e2e',

  border: '#2a2826',
  borderLight: '#3a3835',
} as const;

export type ColorKey = keyof typeof Colors;
