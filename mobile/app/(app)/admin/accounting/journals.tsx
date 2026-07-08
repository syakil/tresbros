import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Card, LoadingSpinner, EmptyState } from '@/components/ui';
import { accountingApi } from '@/api/accounting';
import { formatDate, formatCurrency } from '@/utils/format';

export default function JournalsScreen() {
  const { data: journals = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['journals'],
    queryFn: accountingApi.getJournals,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <FlatList
        data={journals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={<Text style={styles.title}>Jurnal Umum</Text>}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemRef}>{item.reference}</Text>
              <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.itemDesc}>{item.description}</Text>
            {item.lines?.map((line, idx) => (
              <View key={idx} style={styles.line}>
                <Text style={styles.lineAccount}>{line.account?.name ?? `#${line.accountId}`}</Text>
                <View style={styles.lineAmounts}>
                  {line.debit > 0 && <Text style={styles.debit}>D {formatCurrency(line.debit)}</Text>}
                  {line.credit > 0 && <Text style={styles.credit}>K {formatCurrency(line.credit)}</Text>}
                </View>
              </View>
            ))}
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Belum ada jurnal" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  list: { padding: Spacing.base, gap: Spacing.sm },
  title: { ...Typography.title, color: Colors.zinc900, marginBottom: Spacing.sm },
  item: { marginBottom: 0 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  itemRef: { ...Typography.captionMedium, color: Colors.olive },
  itemDate: { ...Typography.caption, color: Colors.zinc400 },
  itemDesc: { ...Typography.body, color: Colors.zinc700, marginBottom: Spacing.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  lineAccount: { ...Typography.caption, color: Colors.zinc600, flex: 1 },
  lineAmounts: { flexDirection: 'row', gap: Spacing.md },
  debit: { ...Typography.caption, color: Colors.primary },
  credit: { ...Typography.caption, color: Colors.danger },
});
