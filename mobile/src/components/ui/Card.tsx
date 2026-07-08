import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { Shape } from '@/theme/shape';
import { Spacing } from '@/theme/spacing';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: Colors.white,
    ...Shape.shadow.sm,
  },
  elevated: {
    backgroundColor: Colors.white,
    ...Shape.shadow.md,
  },
  outlined: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
};

export function Card({ children, variant = 'default', style, padding = 'base' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        { padding: Spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Shape.borderRadius.xl,
  },
});
