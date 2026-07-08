import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Button, Card, StatusBadge, LoadingSpinner } from '@/components/ui';
import { ordersApi } from '@/api/orders';
import { formatCurrency, formatDateTime } from '@/utils/format';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const orderId = Number(id);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Berhasil', 'Status diperbarui');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteOrder = useMutation({
    mutationFn: () => ordersApi.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Berhasil', 'Order dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  if (isLoading || !order) return <LoadingSpinner />;

  const statusFlow = ['TODO', 'IN_PROGRESS', 'DONE', 'TAKEN'];
  const currentIdx = statusFlow.indexOf(order.status);
  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.queue}>#{order.queueNumber}</Text>
            <Text style={styles.orderNo}>{order.orderNumber}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pelanggan</Text>
            <Text style={styles.infoValue}>{order.customerName ?? '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu</Text>
            <Text style={styles.infoValue}>{formatDateTime(order.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pembayaran</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Bayar</Text>
            <Text style={styles.infoValue}>{order.paymentStatus ?? '-'}</Text>
          </View>
        </Card>

        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>Item Pesanan</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.product?.name ?? `Product #${item.productId}`}
                </Text>
                {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </Card>

        <Card variant="elevated" style={styles.totalCard}>
          {order.discountAmount ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Diskon</Text>
              <Text style={[styles.totalValue, { color: Colors.danger }]}>
                -{formatCurrency(order.discountAmount)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.totalValue, { color: Colors.olive, fontSize: 20 }]}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          {nextStatus && (
            <Button
              title={nextStatus === 'DONE' ? 'Selesai' : nextStatus === 'TAKEN' ? 'Ambil' : 'Proses'}
              onPress={() => updateStatus.mutate(nextStatus)}
              loading={updateStatus.isPending}
              fullWidth
            />
          )}
          <Button
            title="Hapus Order"
            variant="danger"
            onPress={() => {
              Alert.alert('Hapus', 'Hapus order ini?', [
                { text: 'Batal' },
                { text: 'Hapus', style: 'destructive', onPress: () => deleteOrder.mutate() },
              ]);
            }}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  queue: { ...Typography.headline, color: Colors.olive },
  orderNo: { ...Typography.caption, color: Colors.zinc400 },
  infoCard: { marginBottom: Spacing.base },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.zinc100 },
  infoLabel: { ...Typography.body, color: Colors.zinc500 },
  infoValue: { ...Typography.bodyMedium, color: Colors.zinc800 },
  section: { marginBottom: Spacing.base },
  sectionTitle: { ...Typography.bodyMedium, color: Colors.zinc800, marginBottom: Spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.zinc100 },
  itemName: { ...Typography.body, color: Colors.zinc800 },
  itemNotes: { ...Typography.caption, color: Colors.zinc400, fontStyle: 'italic', marginTop: 2 },
  itemPrice: { ...Typography.bodyMedium, color: Colors.zinc700 },
  totalCard: { marginBottom: Spacing.base },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  totalLabel: { ...Typography.body, color: Colors.zinc600 },
  totalValue: { ...Typography.bodyMedium, color: Colors.zinc800 },
  actions: { gap: Spacing.sm },
});
