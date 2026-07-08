import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import type { Material } from '@/types/models';

interface MaterialRowProps {
  material: Material;
  showStock?: boolean;
}

export function MaterialRow({ material, showStock = true }: MaterialRowProps) {
  const isLow = material.stock <= material.minStock;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name}>{material.name}</Text>
        <Text style={styles.unit}>{material.unit}</Text>
      </View>
      {showStock && (
        <View style={styles.right}>
          <Text style={[styles.stock, isLow && styles.lowStock]}>
            {material.stock}
          </Text>
          {isLow && <Text style={styles.warning}>⚠ Stok rendah</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  left: { flex: 1 },
  name: {
    ...Typography.bodyMedium,
    color: Colors.zinc900,
  },
  unit: {
    ...Typography.caption,
    color: Colors.zinc400,
  },
  right: {
    alignItems: 'flex-end',
  },
  stock: {
    ...Typography.bodyMedium,
    color: Colors.zinc700,
  },
  lowStock: {
    color: Colors.danger,
  },
  warning: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: 2,
  },
});
