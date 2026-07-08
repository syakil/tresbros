import { TextStyle } from 'react-native';

export const FontFamily = {
  heading: 'Outfit',
  body: 'Inter',
} as const;

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const Typography = {
  headline: {
    fontFamily: FontFamily.heading,
    fontSize: 36,
    fontWeight: FontWeight.bold,
    lineHeight: 44,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 24,
    fontWeight: FontWeight.semibold,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: FontFamily.heading,
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    lineHeight: 28,
  },
  bodyLarge: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    fontWeight: FontWeight.medium,
    lineHeight: 14,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 0.5,
  },
} as const;

export type TypographyToken = keyof typeof Typography;
