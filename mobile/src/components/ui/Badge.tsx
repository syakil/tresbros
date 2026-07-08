import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Shape } from '@/theme/shape';
import { Spacing } from '@/theme/spacing';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'olive' | 'brown';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.zinc100, text: Colors.zinc700 },
  success: { bg: '#D1FAE5', text: '#065F46' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  danger: { bg: Colors.dangerLight, text: '#991B1B' },
  info: { bg: '#DBEAFE', text: '#1E40AF' },
  olive: { bg: '#E8F0E4', text: Colors.olive },
  brown: { bg: '#F5E6D3', text: Colors.brown },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    TODO: 'warning',
    IN_PROGRESS: 'brown',
    DONE: 'success',
    TAKEN: 'olive',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    Draft: 'default',
    Tested: 'info',
    Approved: 'success',
    Rejected: 'danger',
  };

  return <Badge label={status} variant={variantMap[status] ?? 'default'} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Shape.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.captionMedium,
    fontSize: 11,
  },
});
