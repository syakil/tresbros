import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { purchasesApi } from '@/api/purchases';
import { materialsApi } from '@/api/materials';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Purchase } from '@/types/models';

interface PurchaseItemDraft {
  materialId: number;
  materialName: string;
  quantity: string;
  price: string;
}

export default function PurchasesScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<PurchaseItemDraft[]>([]);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [currentItemIdx, setCurrentItemIdx] = useState<number | null>(null);

  const { data: purchases = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['purchases'],
    queryFn: purchasesApi.getAll,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      purchasesApi.create({
        supplierName: supplierName.trim(),
        items: items.map((i) => ({
          materialId: i.materialId,
          quantity: Number(i.quantity),
          price: Number(i.price),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      closeForm();
      Alert.alert('Berhasil', 'Pembelian dibuat');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => purchasesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      Alert.alert('Berhasil', 'Pembelian dibatalkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const closeForm = () => {
    setShowForm(false);
    setSupplierName('');
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, { materialId: 0, materialName: '', quantity: '', price: '' }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof PurchaseItemDraft, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const selectMaterial = (materialId: number, materialName: string) => {
    if (currentItemIdx !== null) {
      updateItem(currentItemIdx, 'materialId', materialId);
      updateItem(currentItemIdx, 'materialName', materialName);
    }
    setShowMaterialPicker(false);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pembelian</Text>
        <Button title="Buat PO" onPress={() => setShowForm(true)} size="sm" />
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemNo}>{item.purchaseNo}</Text>
                <Text style={styles.itemSupplier}>{item.supplierName}</Text>
                <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.itemRight}>
                <StatusBadge status={item.status} />
                <Text style={styles.itemTotal}>{formatCurrency(item.totalAmount)}</Text>
              </View>
            </View>
            {item.items && item.items.length > 0 && (
              <View style={styles.itemDetails}>
                {item.items.map((pi, idx) => (
                  <Text key={idx} style={styles.itemDetail}>
                    {pi.quantity}x {pi.material?.name ?? `Material #${pi.materialId}`}
                    {' - '}
                    {formatCurrency(pi.price)}
                  </Text>
                ))}
              </View>
            )}
            {item.status === 'COMPLETED' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  Alert.alert('Batalkan', 'Batalkan pembelian ini?', [
                    { text: 'Tidak' },
                    { text: 'Ya', style: 'destructive', onPress: () => cancelMutation.mutate(item.id) },
                  ]);
                }}
              >
                <Text style={styles.cancelText}>Batalkan</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="Belum ada pembelian" description="Buat purchase order pertama" />
        }
      />

      <Modal visible={showForm} onClose={closeForm} title="Buat Purchase Order" style={{ maxHeight: '90%' }}>
        <Input
          label="Supplier"
          value={supplierName}
          onChangeText={setSupplierName}
          placeholder="Nama supplier"
        />

        <Text style={styles.itemsLabel}>Item Pembelian</Text>
        {items.map((item, idx) => (
          <View key={idx} style={styles.poItem}>
            <TouchableOpacity
              style={styles.materialSelect}
              onPress={() => {
                setCurrentItemIdx(idx);
                setShowMaterialPicker(true);
              }}
            >
              <Text style={item.materialName ? styles.matSelected : styles.matPlaceholder}>
                {item.materialName || 'Pilih bahan...'}
              </Text>
            </TouchableOpacity>
            <View style={styles.poItemRow}>
              <Input
                value={item.quantity}
                onChangeText={(v) => updateItem(idx, 'quantity', v)}
                placeholder="Qty"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
              <Input
                value={item.price}
                onChangeText={(v) => updateItem(idx, 'price', v)}
                placeholder="Harga"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
              <TouchableOpacity style={styles.removeItemBtn} onPress={() => removeItem(idx)}>
                <Text style={styles.removeItemText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Button title="+ Tambah Item" variant="outline" onPress={addItem} fullWidth size="sm" />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Buat PO"
          onPress={() => createMutation.mutate()}
          loading={createMutation.isPending}
          fullWidth
        />
      </Modal>

      <Modal visible={showMaterialPicker} onClose={() => setShowMaterialPicker(false)} title="Pilih Bahan">
        <FlatList
          data={materials}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.matOption} onPress={() => selectMaterial(item.id, item.name)}>
              <Text style={styles.matOptionName}>{item.name}</Text>
              <Text style={styles.matOptionUnit}>{item.unit} - Stok: {item.stock}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
  },
  headerTitle: { ...Typography.title, color: Colors.zinc900 },
  list: { padding: Spacing.base, paddingTop: 0, gap: Spacing.sm },
  item: { marginBottom: 0 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemNo: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemSupplier: { ...Typography.caption, color: Colors.zinc500, marginTop: 2 },
  itemDate: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: Spacing.xs },
  itemTotal: { ...Typography.bodyMedium, color: Colors.brown },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
    paddingTop: Spacing.sm,
    gap: 2,
  },
  itemDetail: { ...Typography.caption, color: Colors.zinc600 },
  cancelBtn: { marginTop: Spacing.sm },
  cancelText: { ...Typography.captionMedium, color: Colors.danger },
  itemsLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm },
  poItem: {
    backgroundColor: Colors.zinc50,
    padding: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
    marginBottom: Spacing.sm,
  },
  materialSelect: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.md,
    marginBottom: Spacing.sm,
  },
  matSelected: { ...Typography.body, color: Colors.zinc900 },
  matPlaceholder: { ...Typography.body, color: Colors.zinc400 },
  poItemRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  removeItemBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeItemText: { color: Colors.danger, fontSize: 16 },
  matOption: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.base },
  matOptionName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  matOptionUnit: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.zinc100 },
});
