import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
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
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/api/orders';
import { formatCurrency } from '@/utils/format';
import { ORDER_STATUS } from '@/constants/config';
import type { Order, OrderItem } from '@/types/models';

const COLUMNS = [
  { key: ORDER_STATUS.TODO, label: 'Antrean (Queue)', color: '#EF4444', pulseColor: '#FEE2E2' },
  { key: ORDER_STATUS.IN_PROGRESS, label: 'Proses (In Progress)', color: '#F59E0B', pulseColor: '#FEF3C7' },
  { key: ORDER_STATUS.DONE, label: 'Selesai (Done Today)', color: '#10B981', pulseColor: '#D1FAE5' },
] as const;

const STATUS_THEMES = {
  TODO: {
    border: '#E4E4E7',
    badgeBg: '#FEE2E2',
    badgeText: '#EF4444',
    timerBg: '#F4F4F5',
    timerText: '#52525B',
    buttonBg: '#2563EB',
    buttonText: '#FFFFFF',
    buttonLabel: '👨‍🍳 Start Cooking',
    nextStatus: ORDER_STATUS.IN_PROGRESS,
  },
  IN_PROGRESS: {
    border: '#F59E0B',
    badgeBg: '#FEF3C7',
    badgeText: '#D97706',
    timerBg: '#FEF3C7',
    timerText: '#B45309',
    buttonBg: '#10B981',
    buttonText: '#FFFFFF',
    buttonLabel: '✓ Finish Cooking',
    nextStatus: ORDER_STATUS.DONE,
  },
  DONE: {
    border: '#10B981',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    timerBg: '#D1FAE5',
    timerText: '#065F46',
    buttonBg: '#FFFFFF',
    buttonBorder: '#D4D4D8',
    buttonText: '#3F3F46',
    buttonLabel: 'Taken ✓',
    nextStatus: ORDER_STATUS.TAKEN,
  },
};

function LiveTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}m ${s}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);

  return <Text style={styles.timerText}>{elapsed}</Text>;
}

export default function KDSScreen() {
  const queryClient = useQueryClient();
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<OrderItem | null>(null);

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    refetchInterval: 3000, // Refresh every 3 seconds to match web
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

  const getOrdersByStatus = (status: string) =>
    orders.filter((o) => o.status === status && o.paymentStatus === 'success');

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Kitchen Display" subtitle="Real-time Kitchen Order Management" />
      <FlatList
        data={COLUMNS}
        horizontal
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
                <View style={styles.columnHeaderLeft}>
                  <View style={[styles.columnDot, { backgroundColor: Colors.white }]} />
                  <Text style={styles.columnTitle}>{column.label}</Text>
                </View>
                <View style={styles.columnCount}>
                  <Text style={styles.columnCountText}>{columnOrders.length}</Text>
                </View>
              </View>
              <FlatList
                data={columnOrders}
                keyExtractor={(order) => String(order.id)}
                contentContainerStyle={styles.orderList}
                renderItem={({ item: order }) => {
                  const theme = STATUS_THEMES[order.status as keyof typeof STATUS_THEMES] || STATUS_THEMES.TODO;
                  return (
                    <View style={[styles.orderCard, { borderLeftColor: theme.badgeText }]}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderHeaderLeft}>
                          <Text style={styles.orderQueue}>Queue: {order.queueNumber}</Text>
                          {order.customerName ? (
                            <View style={styles.customerBadge}>
                              <Text style={styles.customerBadgeText}>👤 {order.customerName}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={[styles.timerBadge, { backgroundColor: theme.timerBg }]}>
                          <Text style={[styles.timerIcon, { color: theme.timerText }]}>⏱</Text>
                          <LiveTimer createdAt={order.createdAt} />
                        </View>
                      </View>

                      <View style={styles.orderItems}>
                        {order.items?.map((item, idx) => (
                          <View key={idx} style={styles.orderItem}>
                            <View style={styles.orderItemRow}>
                              <View style={styles.qtyBadge}>
                                <Text style={styles.qtyBadgeText}>{item.quantity}x</Text>
                              </View>
                              <Text style={styles.orderItemName}>
                                {item.product?.name ?? `Product #${item.productId}`}
                              </Text>
                              <TouchableOpacity
                                style={styles.viewRecipeBtn}
                                onPress={() => setSelectedRecipeItem(item)}
                              >
                                <Text style={styles.viewRecipeText}>Recipe</Text>
                              </TouchableOpacity>
                            </View>
                            {item.notes ? (
                              <View style={styles.notesContainer}>
                                <Text style={styles.notesText}>
                                  <Text style={{ fontWeight: 'bold' }}>Notes: </Text>
                                  {item.notes}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.advanceBtn,
                          { backgroundColor: theme.buttonBg },
                          theme.buttonBorder ? { borderWidth: 1, borderColor: theme.buttonBorder } : null,
                        ]}
                        onPress={() => handleStatusChange(order, theme.nextStatus)}
                      >
                        <Text style={[styles.advanceBtnText, { color: theme.buttonText }]}>
                          {theme.buttonLabel}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <EmptyState title="Kosong" description="Belum ada pesanan" />
                }
              />
            </View>
          );
        }}
      />

      {/* Recipe Modal */}
      <Modal
        visible={!!selectedRecipeItem}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedRecipeItem(null)}
      >
        <View style={styles.recipeModalOverlay}>
          <View style={styles.recipeModalContent}>
            <View style={styles.recipeModalHeader}>
              <Text style={styles.recipeModalTitle}>Cooking Recipe</Text>
              <TouchableOpacity onPress={() => setSelectedRecipeItem(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.recipeModalScroll}>
              <View style={styles.recipeSection}>
                <Text style={styles.recipeSubLabel}>Menu Name</Text>
                <Text style={styles.recipeMenuName}>{selectedRecipeItem?.product?.name}</Text>
                <View style={styles.recipeQuantityBadge}>
                  <Text style={styles.recipeQuantityBadgeText}>
                    Total Order: {selectedRecipeItem?.quantity} Portions
                  </Text>
                </View>
              </View>

              <View style={styles.recipeIngredientsBox}>
                <Text style={styles.recipeIngredientsHeader}>
                  Bahan (Total {selectedRecipeItem?.quantity} Porsi)
                </Text>

                {selectedRecipeItem?.product?.recipeItems && selectedRecipeItem.product.recipeItems.length > 0 ? (
                  <View style={styles.ingredientsList}>
                    {selectedRecipeItem.product.recipeItems.map((ri) => (
                      <View key={ri.id} style={styles.ingredientRow}>
                        <Text style={styles.ingredientName}>{ri.material?.name ?? 'Bahan'}</Text>
                        <View style={styles.ingredientQtyBadge}>
                          <Text style={styles.ingredientQtyText}>
                            {(ri.quantity * selectedRecipeItem.quantity).toFixed(1).replace('.0', '')} {ri.material?.unit ?? ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noRecipeText}>No recipe / raw material data.</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.recipeModalFooter}>
              <Button
                title="Tutup"
                variant="outline"
                onPress={() => setSelectedRecipeItem(null)}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    height: 52,
  },
  columnHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  columnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  columnTitle: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderColor: Colors.zinc200,
    ...Shape.shadow.sm,
    marginBottom: Spacing.xs,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
    paddingBottom: Spacing.xs,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  orderQueue: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
    color: Colors.zinc900,
  },
  customerBadge: {
    backgroundColor: Colors.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Shape.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
  customerBadgeText: {
    ...Typography.caption,
    color: Colors.zinc600,
    fontWeight: '600',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Shape.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  timerIcon: {
    fontSize: 12,
  },
  timerText: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  orderItems: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  orderItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc50,
    paddingBottom: Spacing.xs,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  qtyBadge: {
    backgroundColor: Colors.olive + '10',
    borderWidth: 1,
    borderColor: Colors.olive + '30',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Shape.borderRadius.sm,
  },
  qtyBadgeText: {
    fontSize: 11,
    ...Typography.captionMedium,
    color: Colors.olive,
    fontWeight: 'bold',
  },
  orderItemName: {
    ...Typography.bodyMedium,
    color: Colors.zinc800,
    flex: 1,
  },
  viewRecipeBtn: {
    backgroundColor: Colors.zinc50,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shape.borderRadius.md,
  },
  viewRecipeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.zinc650,
    textTransform: 'uppercase',
  },
  notesContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1,
    padding: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
    marginTop: 4,
  },
  notesText: {
    ...Typography.caption,
    color: '#92400E',
    lineHeight: 16,
  },
  advanceBtn: {
    paddingVertical: 10,
    borderRadius: Shape.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceBtnText: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
  },
  recipeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  recipeModalContent: {
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius['2xl'],
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  recipeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recipeModalTitle: {
    ...Typography.subtitle,
    color: Colors.zinc900,
    fontWeight: 'bold',
  },
  closeBtn: {
    fontSize: 18,
    color: Colors.zinc400,
    padding: Spacing.xs,
  },
  recipeModalScroll: {
    paddingBottom: Spacing.md,
  },
  recipeSection: {
    marginBottom: Spacing.md,
  },
  recipeSubLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    color: Colors.zinc400,
    letterSpacing: 1,
    marginBottom: 2,
  },
  recipeMenuName: {
    ...Typography.title,
    color: Colors.zinc900,
    fontWeight: 'bold',
  },
  recipeQuantityBadge: {
    backgroundColor: Colors.olive + '10',
    borderColor: Colors.olive,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Shape.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  recipeQuantityBadgeText: {
    fontSize: 11,
    ...Typography.captionMedium,
    color: Colors.olive,
    fontWeight: 'bold',
  },
  recipeIngredientsBox: {
    backgroundColor: Colors.zinc50,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    padding: Spacing.md,
    borderRadius: Shape.borderRadius.xl,
    marginVertical: Spacing.sm,
  },
  recipeIngredientsHeader: {
    fontSize: 11,
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    color: Colors.zinc500,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc200,
    paddingBottom: 6,
    marginBottom: Spacing.sm,
  },
  ingredientsList: {
    gap: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    ...Typography.body,
    color: Colors.zinc700,
  },
  ingredientQtyBadge: {
    backgroundColor: Colors.zinc200,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Shape.borderRadius.md,
  },
  ingredientQtyText: {
    fontSize: 11,
    ...Typography.captionMedium,
    color: Colors.zinc800,
    fontWeight: 'bold',
  },
  noRecipeText: {
    ...Typography.body,
    color: Colors.zinc400,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  recipeModalFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
});
