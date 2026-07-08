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
import { rolesApi } from '@/api/roles';
import type { Role } from '@/types/models';

const ALL_PERMISSIONS = ['pos', 'kds', 'dashboard', 'accounting', 'inventory', 'purchases', 'settings'];

export default function RolesScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const { data: roles = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = { name: name.trim(), description: description.trim(), permissions };
      return editing ? rolesApi.update(editing.id, data) : rolesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowForm(false);
      Alert.alert('Berhasil', editing ? 'Role diperbarui' : 'Role ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      Alert.alert('Berhasil', 'Role dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (role?: Role) => {
    if (role) {
      setEditing(role);
      setName(role.name);
      setDescription(role.description);
      setPermissions(role.permissions ?? []);
    } else {
      setEditing(null);
      setName('');
      setDescription('');
      setPermissions([]);
    }
    setShowForm(true);
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Role</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={roles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <View style={styles.permList}>
              {(item.permissions ?? []).map(p => (
                <View key={p} style={styles.permChip}>
                  <Text style={styles.permText}>{p}</Text>
                </View>
              ))}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openForm(item)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Alert.alert('Hapus', `Hapus role "${item.name}"?`, [
                  { text: 'Batal' },
                  { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                ]);
              }}>
                <Text style={styles.deleteBtn}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada role" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Role' : 'Tambah Role'}>
        <Input label="Nama Role" value={name} onChangeText={setName} />
        <Input label="Deskripsi" value={description} onChangeText={setDescription} />
        <Text style={styles.fieldLabel}>Permissions</Text>
        {ALL_PERMISSIONS.map(p => (
          <TouchableOpacity key={p} style={[styles.permToggle, permissions.includes(p) && styles.permToggleActive]}
            onPress={() => togglePermission(p)}>
            <Text style={[styles.permToggleText, permissions.includes(p) && styles.permToggleTextActive]}>{p}</Text>
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
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemDesc: { ...Typography.caption, color: Colors.zinc500, marginTop: 2, marginBottom: Spacing.sm },
  permList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  permChip: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Shape.borderRadius.full, backgroundColor: Colors.olive + '20' },
  permText: { ...Typography.caption, color: Colors.olive, fontSize: 11 },
  itemActions: { flexDirection: 'row', gap: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.zinc100, paddingTop: Spacing.sm },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  fieldLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  permToggle: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Shape.borderRadius.full, backgroundColor: Colors.zinc100, marginBottom: Spacing.xs, alignSelf: 'flex-start' },
  permToggleActive: { backgroundColor: Colors.olive },
  permToggleText: { ...Typography.captionMedium, color: Colors.zinc600 },
  permToggleTextActive: { color: Colors.white },
});
