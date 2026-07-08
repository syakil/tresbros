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
import { recipesApi } from '@/api/recipes';
import { productsApi } from '@/api/products';
import { materialsApi } from '@/api/materials';
import type { RecipeItem, Product, Material } from '@/types/models';

export default function RecipesScreen() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsApi.getAll,
  });

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', selectedProduct],
    queryFn: () => recipesApi.getAll(selectedProduct ?? undefined),
    enabled: selectedProduct !== null,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      recipesApi.create({
        productId: selectedProduct!,
        materialId: Number(materialId),
        quantity: Number(quantity),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setShowForm(false);
      setMaterialId('');
      setQuantity('');
      Alert.alert('Berhasil', 'Bahan ditambahkan ke resep');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recipesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.productPicker}>
        <Text style={styles.pickerLabel}>Pilih Produk:</Text>
        <FlatList
          horizontal
          data={products}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ gap: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.productChip, selectedProduct === item.id && styles.productChipActive]}
              onPress={() => setSelectedProduct(item.id)}
            >
              <Text style={[styles.productText, selectedProduct === item.id && styles.productTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {selectedProduct ? (
        <>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle}>
              Resep: {products.find((p) => p.id === selectedProduct)?.name}
            </Text>
            <Button title="Tambah Bahan" onPress={() => setShowForm(true)} size="sm" />
          </View>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
              renderItem={({ item }) => (
                <Card variant="outlined" style={styles.item}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>
                        {item.material?.name ?? `Material #${item.materialId}`}
                      </Text>
                      <Text style={styles.itemQty}>
                        {item.quantity} {item.material?.unit ?? ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteMutation.mutate(item.id)}>
                      <Text style={styles.deleteBtn}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}
              ListEmptyComponent={
                <EmptyState title="Belum ada bahan" description="Tambahkan bahan untuk resep ini" />
              }
            />
          )}
        </>
      ) : (
        <EmptyState title="Pilih Produk" description="Pilih produk untuk melihat resepnya" />
      )}

      <Modal visible={showForm} onClose={() => setShowForm(false)} title="Tambah Bahan">
        <View style={styles.matList}>
          <Text style={styles.matLabel}>Bahan</Text>
          {materials.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.matChip, Number(materialId) === m.id && styles.matChipActive]}
              onPress={() => setMaterialId(String(m.id))}
            >
              <Text style={[styles.matText, Number(materialId) === m.id && styles.matTextActive]}>
                {m.name} ({m.unit})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label="Jumlah"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="numeric"
        />
        <Button
          title="Tambah"
          onPress={() => addMutation.mutate()}
          loading={addMutation.isPending}
          fullWidth
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  productPicker: { padding: Spacing.base },
  pickerLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm },
  productChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
  productChipActive: { backgroundColor: Colors.olive, borderColor: Colors.olive },
  productText: { ...Typography.captionMedium, color: Colors.zinc600 },
  productTextActive: { color: Colors.white },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  recipeTitle: { ...Typography.bodyMedium, color: Colors.zinc800 },
  list: { padding: Spacing.base, paddingTop: 0, gap: Spacing.sm },
  item: { marginBottom: 0 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemQty: { ...Typography.caption, color: Colors.zinc500, marginTop: 2 },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  matList: { marginBottom: Spacing.base },
  matLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm },
  matChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.full,
    backgroundColor: Colors.zinc100,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
  },
  matChipActive: { backgroundColor: Colors.olive },
  matText: { ...Typography.captionMedium, color: Colors.zinc600 },
  matTextActive: { color: Colors.white },
});
