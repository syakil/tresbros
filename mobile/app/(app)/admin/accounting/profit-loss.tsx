import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Card, LoadingSpinner } from '@/components/ui';
import { accountingApi } from '@/api/accounting';
import { formatCurrency } from '@/utils/format';

export default function ProfitLossScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['profit-loss'],
    queryFn: () => accountingApi.getProfitLoss({}),
  });

  if (isLoading) return <LoadingSpinner />;

  const isProfit = (data?.netProfit ?? 0) >= 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={styles.title}>Laba Rugi</Text>

        <Card variant="elevated" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Laba Bersih</Text>
          <Text style={[styles.summaryValue, { color: isProfit ? Colors.success : Colors.danger }]}>
            {isProfit ? '+' : ''}{formatCurrency(data?.netProfit ?? 0)}
          </Text>
        </Card>

        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>Pendapatan</Text>
          {data?.revenues?.map((r, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.rowName}>{r.accountName}</Text>
              <Text style={[styles.rowAmount, { color: Colors.success }]}>
                {formatCurrency(r.amount)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pendapatan</Text>
            <Text style={[styles.totalValue, { color: Colors.success }]}>
              {formatCurrency(data?.totalRevenue ?? 0)}
            </Text>
          </View>
        </Card>

        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>Beban</Text>
          {data?.expenses?.map((e, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.rowName}>{e.accountName}</Text>
              <Text style={[styles.rowAmount, { color: Colors.danger }]}>
                {formatCurrency(e.amount)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Beban</Text>
            <Text style={[styles.totalValue, { color: Colors.danger }]}>
              {formatCurrency(data?.totalExpense ?? 0)}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  title: { ...Typography.title, color: Colors.zinc900, marginBottom: Spacing.base },
  summaryCard: { alignItems: 'center', padding: Spacing.xl, marginBottom: Spacing.base },
  summaryLabel: { ...Typography.body, color: Colors.zinc500, marginBottom: Spacing.xs },
  summaryValue: { ...Typography.headline },
  section: { marginBottom: Spacing.base },
  sectionTitle: { ...Typography.bodyMedium, color: Colors.zinc800, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.zinc100 },
  rowName: { ...Typography.body, color: Colors.zinc700 },
  rowAmount: { ...Typography.bodyMedium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.sm, borderTopWidth: 2, borderTopColor: Colors.zinc200 },
  totalLabel: { ...Typography.bodyMedium, color: Colors.zinc900 },
  totalValue: { ...Typography.subtitle },
});
