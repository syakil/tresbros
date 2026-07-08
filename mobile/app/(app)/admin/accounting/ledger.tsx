import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Card, LoadingSpinner, EmptyState, Input } from '@/components/ui';
import { accountingApi } from '@/api/accounting';
import { formatCurrency } from '@/utils/format';

export default function LedgerScreen() {
  const [accountId, setAccountId] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ledger', accountId],
    queryFn: () => accountingApi.getLedger({ accountId: Number(accountId) || undefined }),
    enabled: !!accountId,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Buku Besar</Text>
        <Input
          label="ID Akun"
          value={accountId}
          onChangeText={setAccountId}
          placeholder="Masukkan ID akun"
          keyboardType="numeric"
        />

        {isLoading && accountId ? (
          <LoadingSpinner />
        ) : data?.lines ? (
          <FlatList
            data={data.lines}
            keyExtractor={(_, idx) => String(idx)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            ListHeaderComponent={
              <Text style={styles.accountName}>{data.account?.name ?? 'Akun'}</Text>
            }
            renderItem={({ item, index }) => (
              <Card variant="outlined" style={styles.item}>
                <View style={styles.lineHeader}>
                  <Text style={styles.lineDate}>{item.date ?? ''}</Text>
                  <Text style={styles.lineRef}>{item.reference ?? ''}</Text>
                </View>
                <Text style={styles.lineDesc}>{item.description ?? ''}</Text>
                <View style={styles.amounts}>
                  {item.debit > 0 && <Text style={styles.debit}>D: {formatCurrency(item.debit)}</Text>}
                  {item.credit > 0 && <Text style={styles.credit}>K: {formatCurrency(item.credit)}</Text>}
                </View>
              </Card>
            )}
            ListEmptyComponent={<EmptyState title="Tidak ada transaksi" />}
          />
        ) : (
          <EmptyState title="Masukkan ID Akun" description="Untuk melihat buku besar" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  content: { flex: 1, padding: Spacing.base },
  title: { ...Typography.title, color: Colors.zinc900, marginBottom: Spacing.base },
  list: { gap: Spacing.sm },
  accountName: { ...Typography.bodyMedium, color: Colors.olive, marginBottom: Spacing.sm },
  item: { marginBottom: 0 },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  lineDate: { ...Typography.caption, color: Colors.zinc400 },
  lineRef: { ...Typography.caption, color: Colors.zinc400 },
  lineDesc: { ...Typography.body, color: Colors.zinc700, marginBottom: Spacing.xs },
  amounts: { flexDirection: 'row', gap: Spacing.md },
  debit: { ...Typography.captionMedium, color: Colors.primary },
  credit: { ...Typography.captionMedium, color: Colors.danger },
});
