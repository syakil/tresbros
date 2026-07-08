import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Shape } from '@/theme/shape';
import { Spacing } from '@/theme/spacing';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatTime } from '@/utils/format';
import type { Order } from '@/types/models';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  compact?: boolean;
}

export function OrderCard({ order, onPress, compact = false }: OrderCardProps) {
  const itemCount = order.items?.length ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.queueNumber}>#{order.queueNumber}</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {!compact && order.items && (
        <View style={styles.items}>
          {order.items.slice(0, 3).map((item, idx) => (
            <Text key={idx} style={styles.itemText}>
              {item.quantity}x {item.product?.name ?? `Product #${item.productId}`}
              {item.notes ? ` (${item.notes})` : ''}
            </Text>
          ))}
          {itemCount > 3 && (
            <Text style={styles.moreItems}>+{itemCount - 3} lagi</Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.time}>{formatTime(order.createdAt)}</Text>
        <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.xl,
    padding: Spacing.base,
    ...Shape.shadow.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  queueNumber: {
    ...Typography.subtitle,
    color: Colors.olive,
  },
  orderNumber: {
    ...Typography.caption,
    color: Colors.zinc500,
  },
  items: {
    marginBottom: Spacing.sm,
  },
  itemText: {
    ...Typography.body,
    color: Colors.zinc700,
    marginBottom: 2,
  },
  moreItems: {
    ...Typography.caption,
    color: Colors.zinc400,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
    paddingTop: Spacing.sm,
  },
  time: {
    ...Typography.caption,
    color: Colors.zinc400,
  },
  total: {
    ...Typography.bodyMedium,
    color: Colors.zinc900,
  },
});
