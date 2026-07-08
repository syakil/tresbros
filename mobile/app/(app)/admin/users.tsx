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
import { usersApi } from '@/api/users';
import { rolesApi } from '@/api/roles';
import type { User } from '@/types/models';

export default function UsersScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');

  const { data: users = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> = {
        username: username.trim(),
        fullName: fullName.trim(),
        roleId: Number(roleId),
      };
      if (password) data.password = password;
      return editing ? usersApi.update(editing.id, data) : usersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      Alert.alert('Berhasil', editing ? 'User diperbarui' : 'User ditambahkan');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert('Berhasil', 'User dihapus');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const openForm = (user?: User) => {
    if (user) {
      setEditing(user);
      setUsername(user.username);
      setFullName(user.fullName);
      setPassword('');
      setRoleId(String(user.roleId));
    } else {
      setEditing(null);
      setUsername('');
      setFullName('');
      setPassword('');
      setRoleId('');
    }
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengguna</Text>
        <Button title="Tambah" onPress={() => openForm()} size="sm" />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.fullName?.charAt(0) ?? '?'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.itemName}>{item.fullName}</Text>
                <Text style={styles.itemUsername}>@{item.username}</Text>
              </View>
              <Badge label={item.role?.name ?? ''} variant="olive" />
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openForm(item)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Alert.alert('Hapus', `Hapus user "${item.username}"?`, [
                  { text: 'Batal' },
                  { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                ]);
              }}>
                <Text style={styles.deleteBtn}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada pengguna" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Tambah User'}>
        <Input label="Username" value={username} onChangeText={setUsername} autoCapitalize="none"
          editable={!editing} />
        <Input label="Nama Lengkap" value={fullName} onChangeText={setFullName} />
        <Input label={editing ? 'Password Baru (opsional)' : 'Password'} value={password}
          onChangeText={setPassword} secureTextEntry />
        <Text style={styles.fieldLabel}>Role</Text>
        {roles.map(r => (
          <TouchableOpacity key={r.id} style={[styles.chip, Number(roleId) === r.id && styles.chipActive]}
            onPress={() => setRoleId(String(r.id))}>
            <Text style={[styles.chipText, Number(roleId) === r.id && styles.chipTextActive]}>{r.name}</Text>
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
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.olive, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...Typography.bodyMedium, color: Colors.white },
  itemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  itemUsername: { ...Typography.caption, color: Colors.zinc400 },
  itemActions: { flexDirection: 'row', gap: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.zinc100, paddingTop: Spacing.sm },
  editBtn: { ...Typography.captionMedium, color: Colors.primary },
  deleteBtn: { ...Typography.captionMedium, color: Colors.danger },
  fieldLabel: { ...Typography.bodyMedium, color: Colors.zinc700, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Shape.borderRadius.full, backgroundColor: Colors.zinc100, marginBottom: Spacing.xs, alignSelf: 'flex-start' },
  chipActive: { backgroundColor: Colors.olive },
  chipText: { ...Typography.captionMedium, color: Colors.zinc600 },
  chipTextActive: { color: Colors.white },
});
