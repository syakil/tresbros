import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  icon: {
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.zinc700,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.zinc500,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
