import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Shape } from '@/theme/shape';
import { Spacing } from '@/theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.olive, text: Colors.white },
  secondary: { bg: Colors.zinc800, text: Colors.white },
  accent: { bg: Colors.brown, text: Colors.white },
  danger: { bg: Colors.danger, text: Colors.white },
  outline: { bg: 'transparent', text: Colors.zinc800, border: Colors.zinc300 },
  ghost: { bg: 'transparent', text: Colors.olive },
};

const sizeStyles = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, fontSize: 13 },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, fontSize: 14 },
  lg: { paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, fontSize: 16 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  size = 'md',
  style,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? Colors.zinc300 : vStyle.bg,
          paddingVertical: sStyle.paddingVertical,
          paddingHorizontal: sStyle.paddingHorizontal,
          borderWidth: vStyle.border ? 1 : 0,
          borderColor: vStyle.border,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyle.text} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: disabled ? Colors.zinc500 : vStyle.text,
                fontSize: sStyle.fontSize,
                marginLeft: icon ? Spacing.sm : 0,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Shape.borderRadius.lg,
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: Typography.bodyMedium.fontWeight,
  },
});
