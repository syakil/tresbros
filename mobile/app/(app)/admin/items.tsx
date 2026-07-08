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
import { productsApi, type ProductResponse } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { formatCurrency } from '@/utils/format';

export default function ItemsScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  const { data: products = [], isLoading, refetch, isRefetching } = useQuery<ProductResponse[]>({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: name.trim(),
        price: Number(price),
        category: category.trim() || 'Uncategorized',
      };
      if (editing) {
        return productsApi.update(editing.id, data);
      }
      return productsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeForm();
      Alert.alert('Berhasil', editing ? 'Produk diperbarui' : 'Produk ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Berhasil', 'Produk dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (product?: ProductResponse) => {
    if (product) {
      setEditing(product);
      setName(product.name);
      setPrice(String(product.price));
      setCategory(product.category ?? '');
    } else {
      setEditing(null);
      setName('');
      setPrice('');
      setCategory('');
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setPrice('');
    setCategory('');
  };

  const handleDelete = (product: ProductResponse) => {
    Alert.alert('Hapus', `Hapus "${product.name}"?`, [
      { text: 'Batal' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(product.id) },
    ]);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produk</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>
                  {item.category ?? 'Uncategorized'}
                </Text>
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openForm(item)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteBtn}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="Belum ada produk" description="Tambahkan produk pertama Anda" />
        }
      />

      <Modal visible={showForm} onClose={closeForm} title={editing ? 'Edit Produk' : 'Tambah Produk'}>
        <Input label="Nama Produk" value={name} onChangeText={setName} placeholder="Nama produk" />
        <Input
          label="Harga"
          value={price}
          onChangeText={setPrice}
          placeholder="0"
          keyboardType="numeric"
        />
        <View style={styles.categoryList}>
          <Text style={styles.categoryLabel}>Kategori</Text>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, category === cat.name && styles.catChipActive]}
              onPress={() => setCategory(cat.name)}
            >
              <Text style={[styles.catText, category === cat.name && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title={editing ? 'Simpan' : 'Tambah'}
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
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
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemCategory: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  itemPrice: { ...Typography.bodyMedium, color: Colors.brown },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
    paddingTop: Spacing.sm,
  },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  categoryList: { marginBottom: Spacing.base },
  categoryLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.full,
    backgroundColor: Colors.zinc100,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
  },
  catChipActive: { backgroundColor: Colors.olive },
  catText: { ...Typography.captionMedium, color: Colors.zinc600 },
  catTextActive: { color: Colors.white },
});
