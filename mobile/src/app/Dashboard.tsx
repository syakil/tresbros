import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { api } from '../lib/api';
import { MetricCard } from '../components/MetricCard';
import { formatRupiah } from '../lib/utils';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard?filter=today');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <ScrollView 
      className="flex-1 bg-brand-dark px-4 pt-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A16B3D" />
      }
    >
      <View className="mb-6">
        <Text className="text-brand-cream text-2xl font-bold">Dashboard Hari Ini</Text>
        <Text className="text-brand-sage text-sm">Tarik ke bawah untuk memuat ulang data</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#A16B3D" />
          <Text className="text-brand-sage mt-4">Memuat data analitik...</Text>
        </View>
      ) : (
        <View className="pb-10">
          <MetricCard
            title="Pemasukan"
            subtitle="Total Pendapatan Kotor"
            value={formatRupiah(data?.revenue || 0)}
            icon={<TrendingUp size={20} color="#22c55e" />}
            borderColor="border-l-green-500"
            bgColor="bg-brand-olive"
            iconBgColor="bg-green-500/20"
          />

          <MetricCard
            title="Pengeluaran"
            subtitle="Total Pengeluaran Ops."
            value={formatRupiah(data?.expenses || 0)}
            icon={<TrendingDown size={20} color="#ef4444" />}
            borderColor="border-l-red-500"
            bgColor="bg-brand-olive"
            iconBgColor="bg-red-500/20"
          />

          <MetricCard
            title="Laba/Rugi"
            subtitle="Laba Bersih (Net Profit)"
            value={formatRupiah(data?.netProfit || 0)}
            icon={<DollarSign size={20} color={data?.netProfit >= 0 ? "#60a5fa" : "#f97316"} />}
            borderColor={data?.netProfit >= 0 ? "border-l-blue-400" : "border-l-orange-500"}
            bgColor="bg-brand-olive"
            iconBgColor={data?.netProfit >= 0 ? "bg-blue-400/20" : "bg-orange-500/20"}
          />
          
          <View className="mt-4 p-4 bg-brand-olive rounded-xl border border-white/10">
            <Text className="text-brand-cream font-bold mb-2 text-lg">Ringkasan Lainnya</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-brand-sage">Total Transaksi</Text>
              <Text className="text-white font-bold">{data?.orders || 0}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-brand-sage">Item Terjual</Text>
              <Text className="text-white font-bold">{data?.itemsSold || 0}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
