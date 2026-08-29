import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { ordersApi, OrderResponse } from '@/api/orders';
import { formatCurrency } from '@/utils/format';
import { usePrinterStore } from '@/store/usePrinterStore';
import { printReceipt } from '@/services/printerService';

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const printer = usePrinterStore();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'yesterday' | 'last7days' | 'all'>('today');
  const [selectedPayment, setSelectedPayment] = useState<'ALL' | 'CASH' | 'QRIS'>('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchOrders(selectedFilter);
  }, [selectedFilter, selectedPayment]);

  const fetchOrders = async (filter: 'today' | 'yesterday' | 'last7days' | 'all') => {
    setLoading(true);
    try {
      const now = new Date();
      let start: Date | undefined;
      let end: Date | undefined;

      if (filter === 'today') {
        start = startOfDay(now);
      } else if (filter === 'yesterday') {
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
      } else if (filter === 'last7days') {
        start = startOfDay(subDays(now, 7));
      }
      // 'all' => no date filter

      const startDateStr = start?.toISOString();
      const endDateStr = end?.toISOString();

      const data = await ordersApi.getAll(startDateStr, endDateStr, selectedPayment);
      setOrders(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (order: OrderResponse) => {
    if (!printer.selectedPrinter) {
      Alert.alert('Printer Belum Diatur', 'Silakan atur printer di menu Pengaturan terlebih dahulu.');
      return;
    }

    setIsPrinting(true);
    try {
      const connected = await printer.connect();
      if (!connected) {
        Alert.alert("Gagal", "Tidak dapat terhubung ke printer.");
        return;
      }
      
      await printReceipt(order as any, 'TRES BROS CAFFE');
      Alert.alert('Sukses', 'Struk berhasil dicetak ulang');
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal mencetak struk.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCancel = (order: OrderResponse) => {
    Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.', [
      { text: 'Tidak' },
      {
        text: 'Ya, Batalkan',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.cancel(order.id);
            Alert.alert('Sukses', 'Transaksi berhasil dibatalkan.');
            fetchOrders(selectedFilter);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Gagal membatalkan transaksi.');
          }
        },
      },
    ]);
  };

  const getFilterLabel = (filter: string) => {
    if (filter === 'today') return 'Hari Ini';
    if (filter === 'yesterday') return 'Kemarin';
    if (filter === 'last7days') return '7 Hari';
    if (filter === 'all') return 'Semua';
    return '';
  };

  const getPaymentLabel = (pm: string) => {
    if (pm === 'ALL') return 'Semua Metode';
    if (pm === 'CASH') return 'Tunai (Cash)';
    if (pm === 'QRIS') return 'QRIS';
    return pm;
  };

  const renderItem = ({ item }: { item: OrderResponse }) => (
    <Card variant="outlined" style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.orderDate}>{format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</Text>
        </View>
        <View style={styles.badgesContainer}>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>{item.paymentMethod}</Text>
          </View>
          {item.status === 'CANCELLED' && (
            <View style={[styles.paymentBadge, { backgroundColor: Colors.danger }]}>
              <Text style={[styles.paymentText, { color: Colors.white }]}>DIBATALKAN</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Transaksi</Text>
          <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.actionButtons}>
          {item.status !== 'CANCELLED' && (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelBtnText}>Batalkan</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.printBtn} 
            onPress={() => handlePrint(item)}
            disabled={isPrinting || item.status === 'CANCELLED'}
          >
            <Text style={styles.printBtnText}>Print Ulang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header 
        title="Riwayat Transaksi" 
        showBack 
        onBack={() => router.back()}
        rightElement={
          <View style={styles.headerFilters}>
            <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerFilterBtn}>
              <Text style={styles.filterText}>{getFilterLabel(selectedFilter)}</Text>
              <Text style={styles.filterChevron}>▾</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaymentModal(true)} style={styles.headerFilterBtn}>
              <Text style={[styles.filterText, selectedPayment !== 'ALL' && styles.filterTextActive]}>
                {selectedPayment === 'ALL' ? 'Semua' : selectedPayment}
              </Text>
              <Text style={styles.filterChevron}>▾</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.olive} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Tidak ada transaksi untuk periode ini.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Periode</Text>
            
            {(['today', 'yesterday', 'last7days', 'all'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterOption, selectedFilter === opt && styles.filterOptionActive]}
                onPress={() => {
                  setSelectedFilter(opt);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, selectedFilter === opt && styles.filterOptionTextActive]}>
                  {getFilterLabel(opt)}
                </Text>
                {selectedFilter === opt && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPaymentModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Metode Pembayaran</Text>

            {(['ALL', 'CASH', 'QRIS'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterOption, selectedPayment === opt && styles.filterOptionActive]}
                onPress={() => {
                  setSelectedPayment(opt);
                  setShowPaymentModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, selectedPayment === opt && styles.filterOptionTextActive]}>
                  {getPaymentLabel(opt)}
                </Text>
                {selectedPayment === opt && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  listContainer: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.zinc500,
  },
  filterText: {
    ...Typography.bodyMedium,
    color: Colors.olive,
    fontWeight: '600',
  },
  orderCard: {
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderColor: Colors.zinc200,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
    color: Colors.zinc800,
  },
  orderDate: {
    ...Typography.caption,
    color: Colors.zinc500,
    marginTop: 4,
  },
  paymentBadge: {
    backgroundColor: Colors.zinc100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shape.borderRadius.sm,
  },
  paymentText: {
    ...Typography.captionMedium,
    color: Colors.zinc700,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginVertical: Spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Typography.caption,
    color: Colors.zinc500,
  },
  totalAmount: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
    color: Colors.olive,
  },
  badgesContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
  },
  cancelBtnText: {
    ...Typography.captionMedium,
    color: Colors.danger,
    fontWeight: '600',
  },
  printBtn: {
    backgroundColor: Colors.zinc800,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
  },
  printBtnText: {
    ...Typography.captionMedium,
    color: Colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: '80%',
    borderRadius: Shape.borderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.zinc900,
    marginBottom: Spacing.md,
  },
  filterOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  filterOptionActive: {
    backgroundColor: Colors.zinc50,
  },
  filterOptionText: {
    ...Typography.bodyMedium,
    color: Colors.zinc700,
  },
  filterOptionTextActive: {
    fontWeight: 'bold',
    color: Colors.olive,
  },
  checkmark: {
    ...Typography.bodyMedium,
    color: Colors.olive,
    fontWeight: 'bold',
  },
  headerFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shape.borderRadius.md,
    backgroundColor: Colors.zinc100,
  },
  filterChevron: {
    ...Typography.caption,
    color: Colors.zinc500,
  },
  filterTextActive: {
    color: Colors.olive,
    fontWeight: '600',
  },
});
