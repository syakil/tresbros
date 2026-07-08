import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ordersApi } from '@/api/orders';
import { formatCurrency, formatTime } from '@/utils/format';
import { ORDER_STATUS } from '@/constants/config';
import type { Order } from '@/types/models';

const COLUMNS = [
  { key: ORDER_STATUS.TODO, label: 'Antrean', color: Colors.statusQueue },
  { key: ORDER_STATUS.IN_PROGRESS, label: 'Proses', color: Colors.statusInProgress },
  { key: ORDER_STATUS.DONE, label: 'Selesai', color: Colors.statusDone },
] as const;

export default function KDSScreen() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => {
      Alert.alert('Gagal', err.message || 'Gagal update status');
    },
  });

  const handleStatusChange = (order: Order, newStatus: string) => {
    updateStatus.mutate({ id: order.id, status: newStatus });
  };

  const getNextStatus = (current: string): string | null => {
    switch (current) {
      case ORDER_STATUS.TODO:
        return ORDER_STATUS.IN_PROGRESS;
      case ORDER_STATUS.IN_PROGRESS:
        return ORDER_STATUS.DONE;
      case ORDER_STATUS.DONE:
        return ORDER_STATUS.TAKEN;
      default:
        return null;
    }
  };

  const getOrdersByStatus = (status: string) =>
    orders.filter((o) => o.status === status);

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Kitchen Display" subtitle="Kelola pesanan" />
      <FlatList
        data={COLUMNS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item: column }) => {
          const columnOrders = getOrdersByStatus(column.key);
          return (
            <View style={[styles.column, { width: 340 }]}>
              <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
                <Text style={styles.columnTitle}>{column.label}</Text>
                <View style={styles.columnCount}>
                  <Text style={styles.columnCountText}>{columnOrders.length}</Text>
                </View>
              </View>
              <FlatList
                data={columnOrders}
                keyExtractor={(order) => String(order.id)}
                contentContainerStyle={styles.orderList}
                renderItem={({ item: order }) => (
                  <KDSOrderCard
                    order={order}
                    columnColor={column.color}
                    onAdvance={
                      getNextStatus(order.status)
                        ? () => handleStatusChange(order, getNextStatus(order.status)!)
                        : undefined
                    }
                  />
                )}
                ListEmptyComponent={
                  <EmptyState title="Kosong" description="Belum ada pesanan" />
                }
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function KDSOrderCard({
  order,
  columnColor,
  onAdvance,
}: {
  order: Order;
  columnColor: string;
  onAdvance?: () => void;
}) {
  const elapsed = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60000
  );
  const isOverdue = elapsed > 15;

  return (
    <View style={[styles.orderCard, { borderLeftColor: columnColor }]}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderQueue}>#{order.queueNumber}</Text>
        <Text style={[styles.orderTime, isOverdue && styles.orderTimeOverdue]}>
          {elapsed} menit
        </Text>
      </View>

      <View style={styles.orderItems}>
        {order.items?.map((item, idx) => (
          <View key={idx} style={styles.orderItem}>
            <Text style={styles.orderItemQty}>{item.quantity}x</Text>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemName}>
                {item.product?.name ?? `Product #${item.productId}`}
              </Text>
              {item.notes ? (
                <Text style={styles.orderItemNotes}>{item.notes}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {order.customerName ? (
        <Text style={styles.customerName}>👤 {order.customerName}</Text>
      ) : null}

      {onAdvance && (
        <TouchableOpacity style={styles.advanceBtn} onPress={onAdvance}>
          <Text style={styles.advanceBtnText}>
            {order.status === ORDER_STATUS.DONE ? 'Ambil' : 'Proses →'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  column: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Shape.borderRadius.lg,
    marginBottom: Spacing.sm,
  },
  columnTitle: {
    ...Typography.bodyMedium,
    color: Colors.white,
  },
  columnCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: Shape.borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnCountText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
  orderList: {
    gap: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.xl,
    padding: Spacing.base,
    borderLeftWidth: 4,
    ...Shape.shadow.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderQueue: {
    ...Typography.subtitle,
    color: Colors.zinc900,
  },
  orderTime: {
    ...Typography.caption,
    color: Colors.zinc400,
  },
  orderTimeOverdue: {
    color: Colors.statusAlert,
    fontWeight: '600',
  },
  orderItems: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  orderItemQty: {
    ...Typography.bodyMedium,
    color: Colors.brown,
    minWidth: 24,
  },
  orderItemInfo: { flex: 1 },
  orderItemName: {
    ...Typography.body,
    color: Colors.zinc800,
  },
  orderItemNotes: {
    ...Typography.caption,
    color: Colors.zinc400,
    fontStyle: 'italic',
  },
  customerName: {
    ...Typography.caption,
    color: Colors.zinc500,
    marginBottom: Spacing.sm,
  },
  advanceBtn: {
    backgroundColor: Colors.olive,
    padding: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
    alignItems: 'center',
  },
  advanceBtnText: {
    ...Typography.bodyMedium,
    color: Colors.white,
  },
});
