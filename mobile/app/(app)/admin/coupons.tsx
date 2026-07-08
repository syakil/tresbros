import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Button, Input, Card, Modal, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import { couponsApi } from '@/api/coupons';
import { formatCurrency } from '@/utils/format';
import type { Coupon } from '@/types/models';

export default function CouponsScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [maxUsage, setMaxUsage] = useState('1');

  const { data: coupons = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['coupons'],
    queryFn: couponsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minPurchase: Number(minPurchase),
        maxDiscount: Number(maxDiscount),
        maxUsage: Number(maxUsage),
      };
      return editing ? couponsApi.update(editing.id, data) : couponsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowForm(false);
      Alert.alert('Berhasil', editing ? 'Kupon diperbarui' : 'Kupon ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (coupon: Coupon) => couponsApi.update(coupon.id, { isActive: !coupon.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      Alert.alert('Berhasil', 'Kupon dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (coupon?: Coupon) => {
    if (coupon) {
      setEditing(coupon);
      setCode(coupon.code);
      setType(coupon.type);
      setValue(String(coupon.value));
      setMinPurchase(String(coupon.minPurchase));
      setMaxDiscount(String(coupon.maxDiscount));
      setMaxUsage(String(coupon.maxUsage));
    } else {
      setEditing(null);
      setCode('');
      setType('FIXED');
      setValue('');
      setMinPurchase('0');
      setMaxDiscount('0');
      setMaxUsage('1');
    }
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kupon</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={coupons}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemCode}>{item.code}</Text>
                <Text style={styles.itemValue}>
                  {item.type === 'FIXED' ? formatCurrency(item.value) : `${item.value}%`}
                  {item.minPurchase > 0 ? ` (Min: ${formatCurrency(item.minPurchase)})` : ''}
                </Text>
                <Text style={styles.itemUsage}>
                  Terpakai: {item.currentUsage} / {item.maxUsage}
                </Text>
              </View>
              <Badge label={item.isActive ? 'Aktif' : 'Nonaktif'} variant={item.isActive ? 'success' : 'default'} />
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => toggleMutation.mutate(item)}>
                <Text style={styles.toggleBtn}>{item.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm(item)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Alert.alert('Hapus', 'Hapus kupon ini?', [
                  { text: 'Batal' },
                  { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                ]);
              }}>
                <Text style={styles.deleteBtn}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada kupon" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Kupon' : 'Tambah Kupon'}>
        <Input label="Kode Kupon" value={code} onChangeText={setCode} autoCapitalize="characters" />
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, type === 'FIXED' && styles.typeActive]} onPress={() => setType('FIXED')}>
            <Text style={[styles.typeText, type === 'FIXED' && styles.typeTextActive]}>Nominal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'PERCENTAGE' && styles.typeActive]} onPress={() => setType('PERCENTAGE')}>
            <Text style={[styles.typeText, type === 'PERCENTAGE' && styles.typeTextActive]}>Persen</Text>
          </TouchableOpacity>
        </View>
        <Input label={type === 'FIXED' ? 'Nominal' : 'Persen (%)'} value={value} onChangeText={setValue} keyboardType="numeric" />
        <Input label="Min. Pembelian" value={minPurchase} onChangeText={setMinPurchase} keyboardType="numeric" />
        <Input label="Maks. Diskon" value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="numeric" />
        <Input label="Maks. Penggunaan" value={maxUsage} onChangeText={setMaxUsage} keyboardType="numeric" />
        <Button title={editing ? 'Simpan' : 'Tambah'} onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending} fullWidth />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  headerTitle: { ...Typography.title, color: Colors.zinc900 },
  list: { padding: Spacing.base, paddingTop: 0, gap: Spacing.sm },
  item: { marginBottom: 0 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  itemCode: { ...Typography.bodyMedium, color: Colors.olive },
  itemValue: { ...Typography.body, color: Colors.zinc700, marginTop: 2 },
  itemUsage: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.zinc100, paddingTop: Spacing.sm },
  toggleBtn: { ...Typography.captionMedium, color: Colors.olive },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  typeBtn: { flex: 1, padding: Spacing.sm, borderRadius: Shape.borderRadius.md, backgroundColor: Colors.zinc100, alignItems: 'center' },
  typeActive: { backgroundColor: Colors.olive },
  typeText: { ...Typography.bodyMedium, color: Colors.zinc600 },
  typeTextActive: { color: Colors.white },
});
