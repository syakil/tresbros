import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { dashboardApi } from '@/api/dashboard';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getData,
  });

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header 
        title="Dashboard" 
        subtitle="Ringkasan hari ini" 
        rightAction={
          <TouchableOpacity onPress={handleLogout} style={{ padding: Spacing.xs }}>
            <Text style={{ ...Typography.bodyMedium, color: Colors.danger, fontWeight: '600' }}>Keluar</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.statsRow}>
          <Card variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>Pendapatan</Text>
            <Text style={styles.statValue}>
              {formatCurrency(data?.revenue ?? 0)}
            </Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>Transaksi</Text>
            <Text style={styles.statValue}>{data?.orders ?? 0}</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <Text style={styles.statLabel}>Pengeluaran</Text>
            <Text style={[styles.statValue, { color: Colors.danger }]}>
              {formatCurrency(data?.expenses ?? 0)}
            </Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <Text style={styles.statLabel}>Laba Bersih</Text>
            <Text style={[styles.statValue, { color: (data?.netProfit ?? 0) >= 0 ? Colors.success : Colors.danger }]}>
              {formatCurrency(data?.netProfit ?? 0)}
            </Text>
          </Card>
        </View>

        {data?.topProducts && data.topProducts.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Produk Terlaris</Text>
            {data.topProducts.map((item, idx) => (
              <View key={idx} style={styles.alertRow}>
                <Text style={styles.alertName}>
                  {idx + 1}. {item.name}
                </Text>
                <Text style={styles.alertStock}>{item.qty} terjual</Text>
              </View>
            ))}
          </Card>
        )}

        {data?.chartData && data.chartData.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Tren Penjualan</Text>
            {data.chartData.map((item, idx) => (
              <View key={idx} style={styles.alertRow}>
                <Text style={styles.alertName}>{item.date ?? item.time ?? ''}</Text>
                <Text style={styles.alertStock}>{formatCurrency(item.revenue)}</Text>
              </View>
            ))}
          </Card>
        )}

        {data?.recentOrders && data.recentOrders.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Pesanan Terakhir</Text>
            {data.recentOrders.map((order: any, idx: number) => (
              <View key={idx} style={styles.alertRow}>
                <Text style={styles.alertName}>
                  #{order.queueNumber} - {order.paymentMethod}
                </Text>
                <Text style={styles.alertStock}>{formatCurrency(order.totalAmount)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    padding: Spacing.base,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.zinc500,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.title,
    color: Colors.olive,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.zinc800,
    marginBottom: Spacing.sm,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  alertName: {
    ...Typography.body,
    color: Colors.zinc700,
  },
  alertStock: {
    ...Typography.bodyMedium,
    color: Colors.brown,
  },
});
