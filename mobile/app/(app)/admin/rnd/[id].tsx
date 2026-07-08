import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Button, Input, Card, Modal, StatusBadge, LoadingSpinner } from '@/components/ui';
import { rndApi } from '@/api/rnd';
import { materialsApi } from '@/api/materials';
import { categoriesApi } from '@/api/categories';
import { formatCurrency, formatDate } from '@/utils/format';

export default function RnDDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [matId, setMatId] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [promotePrice, setPromotePrice] = useState('');
  const [promoteCatId, setPromoteCatId] = useState('');
  const [promoteCatName, setPromoteCatName] = useState('');

  const recipeId = Number(id);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['rnd', recipeId],
    queryFn: () => rndApi.getById(recipeId),
    enabled: !!recipeId,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const addIngredientMutation = useMutation({
    mutationFn: () =>
      rndApi.update(recipeId, {
        ingredients: [
          ...(recipe?.ingredients ?? []).map(i => ({
            materialId: i.materialId,
            quantity: i.quantity,
            unit: i.unit,
            costPerUnit: i.costPerUnit,
          })),
          {
            materialId: Number(matId),
            quantity: Number(qty),
            unit: unit || materials.find(m => m.id === Number(matId))?.unit || '',
            costPerUnit: materials.find(m => m.id === Number(matId))?.costPerUnit || 0,
          },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rnd', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['rnd'] });
      setShowAddIngredient(false);
      setMatId('');
      setQty('');
      setUnit('');
      Alert.alert('Berhasil', 'Bahan ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const testMutation = useMutation({
    mutationFn: () => rndApi.test(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rnd', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['rnd'] });
      Alert.alert('Berhasil', 'R&D recipe di-test');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const promoteMutation = useMutation({
    mutationFn: () =>
      rndApi.promote(recipeId, {
        price: Number(promotePrice),
        categoryId: Number(promoteCatId),
        categoryName: promoteCatName || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rnd'] });
      setShowPromote(false);
      Alert.alert('Berhasil', 'R&D dipromosikan ke produk');
      router.back();
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  if (isLoading || !recipe) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{recipe.name}</Text>
          <StatusBadge status={recipe.status} />
        </View>

        {recipe.description ? <Text style={styles.desc}>{recipe.description}</Text> : null}

        <View style={styles.costGrid}>
          <Card variant="outlined" style={styles.costCard}>
            <Text style={styles.costLabel}>Target HPP</Text>
            <Text style={styles.costValue}>{formatCurrency(recipe.targetCost)}</Text>
          </Card>
          <Card variant="outlined" style={styles.costCard}>
            <Text style={styles.costLabel}>Aktual HPP</Text>
            <Text style={styles.costValue}>{formatCurrency(recipe.actualCost)}</Text>
          </Card>
          <Card variant="outlined" style={styles.costCard}>
            <Text style={styles.costLabel}>Harga Jual</Text>
            <Text style={styles.costValue}>{formatCurrency(recipe.sellingPrice)}</Text>
          </Card>
        </View>

        <Card variant="outlined" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bahan</Text>
            <Button title="Tambah" size="sm" variant="outline" onPress={() => setShowAddIngredient(true)} />
          </View>
          {recipe.ingredients?.map((ing, idx) => (
            <View key={idx} style={styles.ingredientRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingName}>{ing.material?.name ?? `#${ing.materialId}`}</Text>
                <Text style={styles.ingQty}>{ing.quantity} {ing.unit}</Text>
              </View>
              <Text style={styles.ingCost}>{formatCurrency(ing.subtotal)}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.actions}>
          <Button title="Test Recipe" variant="accent" onPress={() => testMutation.mutate()}
            loading={testMutation.isPending} fullWidth />
          {recipe.status !== 'Approved' && (
            <Button title="Promote ke Produk" variant="primary" onPress={() => setShowPromote(true)}
              fullWidth />
          )}
        </View>

        {recipe.testHistories && recipe.testHistories.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Riwayat Test</Text>
            {recipe.testHistories.map((th, idx) => (
              <View key={idx} style={styles.historyRow}>
                <Text style={styles.historyVersion}>v{th.testVersion}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyCost}>{formatCurrency(th.actualCost)}</Text>
                  <Text style={styles.historyDate}>{formatDate(th.testedAt)}</Text>
                </View>
                {th.notes ? <Text style={styles.historyNotes}>{th.notes}</Text> : null}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Modal visible={showAddIngredient} onClose={() => setShowAddIngredient(false)} title="Tambah Bahan">
        <Text style={styles.fieldLabel}>Pilih Bahan</Text>
        {materials.map(m => (
          <TouchableOpacity key={m.id} style={[styles.chip, Number(matId) === m.id && styles.chipActive]}
            onPress={() => { setMatId(String(m.id)); setUnit(m.unit); }}>
            <Text style={[styles.chipText, Number(matId) === m.id && styles.chipTextActive]}>
              {m.name} ({m.unit})
            </Text>
          </TouchableOpacity>
        ))}
        <Input label="Jumlah" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input label="Satuan" value={unit} onChangeText={setUnit} />
        <Button title="Tambah" onPress={() => addIngredientMutation.mutate()}
          loading={addIngredientMutation.isPending} fullWidth />
      </Modal>

      <Modal visible={showPromote} onClose={() => setShowPromote(false)} title="Promote ke Produk">
        <Input label="Harga Jual" value={promotePrice} onChangeText={setPromotePrice} keyboardType="numeric" />
        <Text style={styles.fieldLabel}>Kategori</Text>
        {categories.map(c => (
          <TouchableOpacity key={c.id} style={[styles.chip, Number(promoteCatId) === c.id && styles.chipActive]}
            onPress={() => { setPromoteCatId(String(c.id)); setPromoteCatName(c.name); }}>
            <Text style={[styles.chipText, Number(promoteCatId) === c.id && styles.chipTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
        <Button title="Promote" onPress={() => promoteMutation.mutate()}
          loading={promoteMutation.isPending} fullWidth />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  name: { ...Typography.title, color: Colors.zinc900, flex: 1 },
  desc: { ...Typography.body, color: Colors.zinc600, marginBottom: Spacing.base },
  costGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  costCard: { flex: 1, alignItems: 'center', padding: Spacing.sm },
  costLabel: { ...Typography.caption, color: Colors.zinc400 },
  costValue: { ...Typography.bodyMedium, color: Colors.brown, marginTop: 2 },
  section: { marginBottom: Spacing.base },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.bodyMedium, color: Colors.zinc800 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.zinc100 },
  ingName: { ...Typography.body, color: Colors.zinc800 },
  ingQty: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  ingCost: { ...Typography.bodyMedium, color: Colors.zinc700 },
  actions: { gap: Spacing.sm, marginBottom: Spacing.base },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.zinc100, gap: Spacing.sm },
  historyVersion: { ...Typography.captionMedium, color: Colors.olive, minWidth: 32 },
  historyCost: { ...Typography.bodyMedium, color: Colors.zinc700 },
  historyDate: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  historyNotes: { ...Typography.caption, color: Colors.zinc500, fontStyle: 'italic' },
  fieldLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Shape.borderRadius.full, backgroundColor: Colors.zinc100, marginBottom: Spacing.xs, alignSelf: 'flex-start' },
  chipActive: { backgroundColor: Colors.olive },
  chipText: { ...Typography.captionMedium, color: Colors.zinc600 },
  chipTextActive: { color: Colors.white },
});
