import React from 'react';
import { View, Text, StyleSheet, Alert, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { settingsApi } from '@/api/settings';

export default function SettingsScreen() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  });

  const upsertMutation = useMutation({
    mutationFn: (setting: { key: string; value: string; dataType: string }) =>
      settingsApi.upsert(setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => settingsApi.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      Alert.alert('Berhasil', 'Database di-reset');
    },
    onError: (err: Error) => Alert.alert('Gagal', err.message),
  });

  const taxEnabled = settings.find(s => s.key === 'TAX_ENABLED')?.value === 'true';

  const handleToggleTax = () => {
    upsertMutation.mutate({
      key: 'TAX_ENABLED',
      value: taxEnabled ? 'false' : 'true',
      dataType: 'bool',
    });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Database',
      'PERINGATAN: Semua data akan dihapus. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetMutation.mutate() },
      ]
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Pengaturan</Text>

        <Card variant="outlined" style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Pajak (PB1 11%)</Text>
              <Text style={styles.settingDesc}>Aktifkan/nonaktifkan pajak restoran</Text>
            </View>
            <Switch
              value={taxEnabled}
              onValueChange={handleToggleTax}
              trackColor={{ false: Colors.zinc300, true: Colors.olive }}
              thumbColor={Colors.white}
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles.card}>
          <Text style={styles.dangerTitle}>Zona Berbahaya</Text>
          <Text style={styles.dangerDesc}>
            Reset database akan menghapus semua data transaksi, stok, dan pengaturan.
          </Text>
          <Button
            title="Reset Database"
            variant="danger"
            onPress={handleReset}
            loading={resetMutation.isPending}
            fullWidth
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  content: { padding: Spacing.base },
  title: { ...Typography.title, color: Colors.zinc900, marginBottom: Spacing.base },
  card: { marginBottom: Spacing.base },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { ...Typography.bodyMedium, color: Colors.zinc900 },
  settingDesc: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  dangerTitle: { ...Typography.bodyMedium, color: Colors.danger, marginBottom: Spacing.sm },
  dangerDesc: { ...Typography.body, color: Colors.zinc500, marginBottom: Spacing.base },
});
