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
import { accountingApi } from '@/api/accounting';
import type { ChartOfAccount } from '@/types/models';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const typeColors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'olive'> = {
  ASSET: 'info', LIABILITY: 'warning', EQUITY: 'olive', REVENUE: 'success', EXPENSE: 'danger',
};

export default function COAScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  const { data: coa = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['coa'],
    queryFn: accountingApi.getCOA,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = { code: code.trim(), name: name.trim(), type };
      return editing ? accountingApi.updateCOA(editing.id, data) : accountingApi.createCOA(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa'] });
      setShowForm(false);
      Alert.alert('Berhasil');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountingApi.deleteCOA(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coa'] }),
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (account?: ChartOfAccount) => {
    if (account) {
      setEditing(account);
      setCode(account.code);
      setName(account.name);
      setType(account.type);
    } else {
      setEditing(null);
      setCode('');
      setName('');
      setType('');
    }
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chart of Accounts</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={coa}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemCode}>{item.code}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Badge label={item.type} variant={typeColors[item.type] ?? 'default'} />
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openForm(item)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Alert.alert('Hapus', 'Hapus akun ini?', [
                  { text: 'Batal' },
                  { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                ]);
              }}>
                <Text style={styles.deleteBtn}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada akun" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Akun' : 'Tambah Akun'}>
        <Input label="Kode" value={code} onChangeText={setCode} />
        <Input label="Nama" value={name} onChangeText={setName} />
        <Text style={styles.fieldLabel}>Tipe Akun</Text>
        {ACCOUNT_TYPES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}>
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: Spacing.md }} />
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
  itemCode: { ...Typography.captionMedium, color: Colors.olive },
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.zinc100, paddingTop: Spacing.sm },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  fieldLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Shape.borderRadius.full, backgroundColor: Colors.zinc100, marginBottom: Spacing.xs, alignSelf: 'flex-start' },
  chipActive: { backgroundColor: Colors.olive },
  chipText: { ...Typography.captionMedium, color: Colors.zinc600 },
  chipTextActive: { color: Colors.white },
});
