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
import { Button, Input, Card, Modal, LoadingSpinner, EmptyState } from '@/components/ui';
import { expensesApi } from '@/api/expenses';
import { accountingApi } from '@/api/accounting';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Expense } from '@/types/models';

export default function ExpensesScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');

  const { data: expenses = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  });

  const { data: coa = [] } = useQuery({
    queryKey: ['coa'],
    queryFn: accountingApi.getCOA,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        description: description.trim(),
        amount: Number(amount),
        date,
        accountId: Number(accountId),
        paymentAccountId: Number(paymentAccountId),
      };
      return editing ? expensesApi.update(editing.id, data) : expensesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      closeForm();
      Alert.alert('Berhasil', editing ? 'Pengeluaran diperbarui' : 'Pengeluaran ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Alert.alert('Berhasil', 'Pengeluaran dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (expense?: Expense) => {
    if (expense) {
      setEditing(expense);
      setDescription(expense.description);
      setAmount(String(expense.amount));
      setDate(expense.date.split('T')[0]);
      setAccountId(String(expense.accountId));
      setPaymentAccountId(String(expense.paymentAccountId));
    } else {
      setEditing(null);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setAccountId('');
      setPaymentAccountId('');
    }
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengeluaran</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.description}</Text>
                <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
                <Text style={styles.itemAccount}>{item.account?.name ?? ''}</Text>
              </View>
              <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openForm(item)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Alert.alert('Hapus', 'Hapus pengeluaran ini?', [
                  { text: 'Batal' },
                  { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                ]);
              }}>
                <Text style={styles.deleteBtn}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada pengeluaran" />}
      />

      <Modal visible={showForm} onClose={closeForm} title={editing ? 'Edit' : 'Tambah Pengeluaran'}>
        <Input label="Deskripsi" value={description} onChangeText={setDescription} />
        <Input label="Jumlah" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Input label="Tanggal" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <Text style={styles.fieldLabel}>Akun</Text>
        {coa.filter(a => a.type === 'EXPENSE').map(a => (
          <TouchableOpacity key={a.id} style={[styles.chip, Number(accountId) === a.id && styles.chipActive]}
            onPress={() => setAccountId(String(a.id))}>
            <Text style={[styles.chipText, Number(accountId) === a.id && styles.chipTextActive]}>{a.code} - {a.name}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.fieldLabel}>Akun Pembayaran</Text>
        {coa.filter(a => a.type === 'ASSET').map(a => (
          <TouchableOpacity key={a.id} style={[styles.chip, Number(paymentAccountId) === a.id && styles.chipActive]}
            onPress={() => setPaymentAccountId(String(a.id))}>
            <Text style={[styles.chipText, Number(paymentAccountId) === a.id && styles.chipTextActive]}>{a.code} - {a.name}</Text>
          </TouchableOpacity>
        ))}
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
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemDate: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  itemAccount: { ...Typography.caption, color: Colors.zinc500, marginTop: 2 },
  itemAmount: { ...Typography.bodyMedium, color: Colors.danger },
  itemActions: { flexDirection: 'row', gap: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.zinc100, paddingTop: Spacing.sm },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  fieldLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Shape.borderRadius.full, backgroundColor: Colors.zinc100, marginBottom: Spacing.xs, alignSelf: 'flex-start' },
  chipActive: { backgroundColor: Colors.olive },
  chipText: { ...Typography.captionMedium, color: Colors.zinc600 },
  chipTextActive: { color: Colors.white },
});
