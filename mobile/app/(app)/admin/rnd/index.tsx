import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Button, Input, Card, Modal, StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui';
import { rndApi } from '@/api/rnd';
import { formatCurrency } from '@/utils/format';
import type { RnDRecipe } from '@/types/models';

export default function RnDScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetCost, setTargetCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  const { data: recipes = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rnd'],
    queryFn: rndApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      rndApi.create({
        name: name.trim(),
        description: description.trim(),
        targetCost: Number(targetCost) || 0,
        sellingPrice: Number(sellingPrice) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rnd'] });
      setShowForm(false);
      setName('');
      setDescription('');
      setTargetCost('');
      setSellingPrice('');
      Alert.alert('Berhasil', 'R&D recipe dibuat');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rndApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rnd'] });
      Alert.alert('Berhasil', 'R&D recipe dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>R&D</Text>
        <Button title="Buat Baru" onPress={() => setShowForm(true)} size="sm" />
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/admin/rnd/${item.id}`)}
            activeOpacity={0.7}
          >
            <Card variant="outlined" style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View style={styles.costRow}>
                <View>
                  <Text style={styles.costLabel}>Target HPP</Text>
                  <Text style={styles.costValue}>{formatCurrency(item.targetCost)}</Text>
                </View>
                <View>
                  <Text style={styles.costLabel}>Harga Jual</Text>
                  <Text style={styles.costValue}>{formatCurrency(item.sellingPrice)}</Text>
                </View>
                <View>
                  <Text style={styles.costLabel}>Aktual HPP</Text>
                  <Text style={styles.costValue}>{formatCurrency(item.actualCost)}</Text>
                </View>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Hapus', 'Hapus R&D recipe ini?', [
                    { text: 'Batal' },
                    { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                  ]);
                }}>
                  <Text style={styles.deleteBtn}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada R&D" description="Buat resep R&D baru" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title="Buat R&D Recipe">
        <Input label="Nama" value={name} onChangeText={setName} />
        <Input label="Deskripsi" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        <Input label="Target HPP" value={targetCost} onChangeText={setTargetCost} keyboardType="numeric" />
        <Input label="Harga Jual" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" />
        <Button title="Buat" onPress={() => createMutation.mutate()}
          loading={createMutation.isPending} fullWidth />
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
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemDesc: { ...Typography.caption, color: Colors.zinc500, marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  costLabel: { ...Typography.caption, color: Colors.zinc400 },
  costValue: { ...Typography.bodyMedium, color: Colors.brown, marginTop: 2 },
  itemActions: { borderTopWidth: 1, borderTopColor: Colors.zinc100, paddingTop: Spacing.sm },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
});
