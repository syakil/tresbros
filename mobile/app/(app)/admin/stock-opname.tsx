import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
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
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { materialsApi, type MaterialResponse } from '@/api/materials';

interface OpnameState {
  actualStock: string;
  unitPrice: string;
  notes: string;
}

export default function StockOpnameScreen() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [opnameStates, setOpnameStates] = useState<Record<number, OpnameState>>({});

  const { data: materials = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsApi.getAll,
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: { id: number; adjustType: 'in' | 'out'; quantity: number; totalPrice: number; notes: string }) =>
      materialsApi.adjust(payload.id, {
        adjustType: payload.adjustType,
        quantity: payload.quantity,
        totalPrice: payload.totalPrice,
        notes: payload.notes,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setOpnameStates((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      Alert.alert('Berhasil', 'Stok opname berhasil disimpan.');
    },
    onError: (err: Error) => {
      Alert.alert('Gagal', err.message || 'Gagal menyimpan stok opname.');
    },
  });

  const handleStateChange = (materialId: number, field: keyof OpnameState, value: string) => {
    setOpnameStates((prev) => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || { actualStock: '', unitPrice: '', notes: '' }),
        [field]: value,
      },
    }));
  };

  const handleSaveOpname = (material: MaterialResponse) => {
    const systemStock = material.stock;
    const state = opnameStates[material.id];

    if (!state || state.actualStock === '') {
      Alert.alert('Peringatan', 'Masukkan stok fisik aktual terlebih dahulu.');
      return;
    }

    const actualStock = parseFloat(state.actualStock);
    if (isNaN(actualStock) || actualStock < 0) {
      Alert.alert('Error', 'Stok aktual harus 0 atau lebih.');
      return;
    }

    const diff = actualStock - systemStock;
    if (diff === 0) {
      Alert.alert('Info', 'Tidak ada selisih stok. Tidak perlu penyesuaian.');
      return;
    }

    const adjustType = diff > 0 ? 'in' : 'out';
    const quantity = Math.abs(diff);

    let totalPrice = 0;
    if (adjustType === 'in') {
      const uPrice = state.unitPrice !== '' ? parseFloat(state.unitPrice) : material.costPerUnit;
      if (isNaN(uPrice) || uPrice < 0) {
        Alert.alert('Error', 'Harga per unit harus 0 atau lebih.');
        return;
      }
      totalPrice = quantity * uPrice;
    }

    const defaultNotes = adjustType === 'in'
      ? 'Stock Opname (Surplus +)'
      : 'Stock Opname (Defisit -)';
    const notes = state.notes || defaultNotes;

    adjustMutation.mutate({ id: material.id, adjustType, quantity, totalPrice, notes });
  };

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  const renderMaterialItem = ({ item }: { item: MaterialResponse }) => {
    const state = opnameStates[item.id] || { actualStock: '', unitPrice: '', notes: '' };
    const systemStock = item.stock;
    const hasInput = state.actualStock !== '';
    const actualStockVal = hasInput ? parseFloat(state.actualStock) : systemStock;
    const diff = hasInput ? actualStockVal - systemStock : 0;

    return (
      <Card variant="outlined" style={styles.materialCard}>
        {/* Material Info */}
        <View style={styles.materialHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.materialName}>{item.name}</Text>
            <Text style={styles.materialUnit}>{item.unit}</Text>
          </View>
          <View style={styles.systemStockBox}>
            <Text style={styles.systemStockLabel}>Stok Sistem</Text>
            <Text style={styles.systemStockValue}>
              {systemStock.toLocaleString('id-ID')} <Text style={styles.unitText}>{item.unit}</Text>
            </Text>
          </View>
        </View>

        {/* Actual Stock Input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Stok Fisik Aktual</Text>
          <TextInput
            style={styles.stockInput}
            placeholder="Input qty..."
            placeholderTextColor={Colors.zinc400}
            keyboardType="numeric"
            value={state.actualStock}
            onChangeText={(v) => handleStateChange(item.id, 'actualStock', v)}
          />
        </View>

        {/* Discrepancy Badge */}
        {hasInput && (
          <View style={styles.diffRow}>
            <Text style={styles.inputLabel}>Selisih</Text>
            {diff > 0 ? (
              <View style={styles.surplusBadge}>
                <Text style={styles.surplusText}>+{diff.toLocaleString('id-ID')} {item.unit} (Surplus)</Text>
              </View>
            ) : diff < 0 ? (
              <View style={styles.deficitBadge}>
                <Text style={styles.deficitText}>{diff.toLocaleString('id-ID')} {item.unit} (Defisit)</Text>
              </View>
            ) : (
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>Cocok ✓</Text>
              </View>
            )}
          </View>
        )}

        {/* Price Input (only for surplus) */}
        {hasInput && diff > 0 && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Harga per {item.unit} (Rp)</Text>
            <TextInput
              style={styles.stockInput}
              placeholder={String(item.costPerUnit)}
              placeholderTextColor={Colors.zinc400}
              keyboardType="numeric"
              value={state.unitPrice}
              onChangeText={(v) => handleStateChange(item.id, 'unitPrice', v)}
            />
          </View>
        )}

        {/* FIFO note for deficit */}
        {hasInput && diff < 0 && (
          <View style={styles.fifoNote}>
            <Text style={styles.fifoNoteText}>Harga dihitung otomatis (FIFO)</Text>
          </View>
        )}

        {/* Notes Input */}
        {hasInput && diff !== 0 && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Catatan / Alasan</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Alasan selisih..."
              placeholderTextColor={Colors.zinc400}
              value={state.notes}
              onChangeText={(v) => handleStateChange(item.id, 'notes', v)}
            />
          </View>
        )}

        {/* Save Button */}
        {hasInput && diff !== 0 && (
          <Button
            title="Simpan Opname"
            onPress={() => handleSaveOpname(item)}
            loading={adjustMutation.isPending}
            fullWidth
            style={styles.saveBtn}
          />
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Stok Opname" showBack />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Cari bahan baku..."
          placeholderTextColor={Colors.zinc400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={renderMaterialItem}
        ListEmptyComponent={
          <EmptyState
            title="Tidak ada bahan baku"
            description="Belum ada bahan baku terdaftar."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  searchContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.zinc800,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 40,
  },
  materialCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  materialName: {
    ...Typography.bodyMedium,
    color: Colors.zinc900,
    fontWeight: '600',
  },
  materialUnit: {
    ...Typography.caption,
    color: Colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  systemStockBox: {
    alignItems: 'flex-end',
  },
  systemStockLabel: {
    ...Typography.caption,
    color: Colors.zinc400,
    marginBottom: 2,
  },
  systemStockValue: {
    ...Typography.bodyMedium,
    color: Colors.zinc800,
    fontWeight: '700',
  },
  unitText: {
    ...Typography.caption,
    color: Colors.zinc400,
    fontWeight: '400',
  },
  inputRow: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.zinc500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  stockInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.zinc800,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.zinc800,
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  surplusBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: Shape.borderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  surplusText: {
    ...Typography.caption,
    color: '#047857',
    fontWeight: '700',
  },
  deficitBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: Shape.borderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  deficitText: {
    ...Typography.caption,
    color: '#b91c1c',
    fontWeight: '700',
  },
  matchBadge: {
    backgroundColor: Colors.zinc100,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  matchText: {
    ...Typography.caption,
    color: Colors.zinc500,
    fontWeight: '600',
  },
  fifoNote: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: Shape.borderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  fifoNoteText: {
    ...Typography.caption,
    color: '#2563eb',
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: Spacing.xs,
  },
});
