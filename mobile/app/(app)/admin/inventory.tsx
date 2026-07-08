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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { materialsApi } from '@/api/materials';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { Material } from '@/types/models';

export default function InventoryScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Material | null>(null);
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustPrice, setAdjustPrice] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const { data: materials = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: name.trim(),
        stock: Number(stock),
        minStock: Number(minStock),
        unit: unit.trim(),
        costPerUnit: Number(costPerUnit),
      };
      if (editing) return materialsApi.update(editing.id, data);
      return materialsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      closeForm();
      Alert.alert('Berhasil', editing ? 'Bahan diperbarui' : 'Bahan ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      materialsApi.adjust(adjustTarget!.id, {
        adjustType,
        quantity: Number(adjustQty),
        totalPrice: Number(adjustPrice) || 0,
        notes: adjustNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowAdjust(false);
      Alert.alert('Berhasil', 'Stok disesuaikan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materialsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (material?: Material) => {
    if (material) {
      setEditing(material);
      setName(material.name);
      setStock(String(material.stock));
      setMinStock(String(material.minStock));
      setUnit(material.unit);
      setCostPerUnit(String(material.costPerUnit));
    } else {
      setEditing(null);
      setName('');
      setStock('0');
      setMinStock('0');
      setUnit('');
      setCostPerUnit('0');
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const openAdjust = (material: Material) => {
    setAdjustTarget(material);
    setAdjustType('in');
    setAdjustQty('');
    setAdjustPrice('');
    setAdjustNotes('');
    setShowAdjust(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventori</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={materials}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const isLow = item.stock <= item.minStock;
          return (
            <Card variant="outlined" style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.itemStock, isLow && styles.lowStock]}>
                    {formatNumber(item.stock)}
                  </Text>
                  {isLow && <Text style={styles.lowLabel}>⚠ Rendah</Text>}
                </View>
              </View>
              <Text style={styles.itemCost}>
                HPP: {formatCurrency(item.costPerUnit)} / {item.unit}
              </Text>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => openAdjust(item)}>
                  <Text style={styles.adjustBtn}>Adjust Stok</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openForm(item)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Hapus', `Hapus "${item.name}"?`, [
                    { text: 'Batal' },
                    { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                  ]);
                }}>
                  <Text style={styles.deleteBtn}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="Belum ada bahan" description="Tambahkan bahan baku" />
        }
      />

      <Modal visible={showForm} onClose={closeForm} title={editing ? 'Edit Bahan' : 'Tambah Bahan'}>
        <Input label="Nama" value={name} onChangeText={setName} placeholder="Nama bahan" />
        <Input label="Satuan" value={unit} onChangeText={setUnit} placeholder="gram, ml, pcs" />
        <Input label="Stok" value={stock} onChangeText={setStock} keyboardType="numeric" />
        <Input label="Stok Minimum" value={minStock} onChangeText={setMinStock} keyboardType="numeric" />
        <Input label="HPP" value={costPerUnit} onChangeText={setCostPerUnit} keyboardType="numeric" />
        <Button
          title={editing ? 'Simpan' : 'Tambah'}
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          fullWidth
        />
      </Modal>

      <Modal visible={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stok">
        <Text style={styles.adjustTarget}>
          {adjustTarget?.name} (Stok: {formatNumber(adjustTarget?.stock ?? 0)} {adjustTarget?.unit})
        </Text>
        <View style={styles.adjustTypeRow}>
          <TouchableOpacity
            style={[styles.adjustTypeBtn, adjustType === 'in' && styles.adjustTypeIn]}
            onPress={() => setAdjustType('in')}
          >
            <Text style={[styles.adjustTypeText, adjustType === 'in' && styles.adjustTypeTextActive]}>
              Masuk
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adjustTypeBtn, adjustType === 'out' && styles.adjustTypeOut]}
            onPress={() => setAdjustType('out')}
          >
            <Text style={[styles.adjustTypeText, adjustType === 'out' && styles.adjustTypeTextActive]}>
              Keluar
            </Text>
          </TouchableOpacity>
        </View>
        <Input label="Jumlah" value={adjustQty} onChangeText={setAdjustQty} keyboardType="numeric" />
        <Input label="Total Harga" value={adjustPrice} onChangeText={setAdjustPrice} keyboardType="numeric" />
        <Input label="Catatan" value={adjustNotes} onChangeText={setAdjustNotes} placeholder="Opsional" />
        <Button
          title="Simpan"
          onPress={() => adjustMutation.mutate()}
          loading={adjustMutation.isPending}
          fullWidth
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
    marginBottom: Spacing.xs,
  },
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemUnit: { ...Typography.caption, color: Colors.zinc400 },
  itemRight: { alignItems: 'flex-end' },
  itemStock: { ...Typography.bodyMedium, color: Colors.zinc700 },
  lowStock: { color: Colors.danger },
  lowLabel: { ...Typography.caption, color: Colors.warning, marginTop: 2 },
  itemCost: { ...Typography.caption, color: Colors.zinc500, marginBottom: Spacing.sm },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
    paddingTop: Spacing.sm,
  },
  adjustBtn: { ...Typography.captionMedium, color: Colors.olive },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  adjustTarget: { ...Typography.body, color: Colors.zinc600, marginBottom: Spacing.base },
  adjustTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  adjustTypeBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
    backgroundColor: Colors.zinc100,
    alignItems: 'center',
  },
  adjustTypeIn: { backgroundColor: Colors.success },
  adjustTypeOut: { backgroundColor: Colors.danger },
  adjustTypeText: { ...Typography.bodyMedium, color: Colors.zinc600 },
  adjustTypeTextActive: { color: Colors.white },
});
