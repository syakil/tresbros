import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Shape } from '@/theme/shape';
import { Spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types/models';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    category?: string;
    availableCount?: number | null;
  };
  onPress: () => void;
  compact?: boolean;
}

export function ProductCard({ product, onPress, compact = false }: ProductCardProps) {
  const isAvailable = (product.availableCount ?? 1) > 0;

  return (
    <TouchableOpacity
      style={[styles.card, !isAvailable && styles.unavailable]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!isAvailable}
    >
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
          {product.name}
        </Text>
        {product.category ? (
          <Text style={styles.category}>{product.category}</Text>
        ) : null}
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
      </View>
      {!isAvailable && (
        <View style={styles.overlay}>
          <Text style={styles.unavailableText}>Habis</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.xl,
    padding: Spacing.base,
    ...Shape.shadow.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  unavailable: {
    opacity: 0.5,
  },
  content: {
    gap: Spacing.xs,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.zinc900,
  },
  category: {
    ...Typography.caption,
    color: Colors.zinc400,
  },
  price: {
    ...Typography.bodyMedium,
    color: Colors.brown,
    marginTop: Spacing.xs,
  },
  overlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shape.borderRadius.sm,
  },
  unavailableText: {
    ...Typography.captionMedium,
    color: Colors.white,
    fontSize: 10,
  },
});
