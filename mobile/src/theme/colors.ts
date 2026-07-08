export const Colors = {
  olive: '#4B5A3A',
  sage: '#7D8F6A',
  cream: '#F3EDE1',
  brown: '#A16B3D',
  dark: '#3A2B1F',

  statusQueue: '#7D8F6A',
  statusInProgress: '#A16B3D',
  statusDone: '#4B5A3A',
  statusAlert: '#C53030',

  white: '#FFFFFF',
  zinc50: '#FAFAFA',
  zinc100: '#F4F4F5',
  zinc200: '#E4E4E7',
  zinc300: '#D4D4D8',
  zinc400: '#A1A1AA',
  zinc500: '#71717A',
  zinc600: '#52525B',
  zinc700: '#3F3F46',
  zinc800: '#27272A',
  zinc900: '#18181B',
  zinc950: '#09090B',

  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
} as const;

export type ColorToken = keyof typeof Colors;
