import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ordersApi } from '@/api/orders';
import { formatCurrency, formatTime } from '@/utils/format';
import { ORDER_STATUS } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEMS_PER_PAGE = 6;

export default function QueueScreen() {
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    refetchInterval: 3000,
  });

  const activeOrders = orders.filter(
    (o) => o.status === ORDER_STATUS.TODO || o.status === ORDER_STATUS.IN_PROGRESS
  );

  const totalPages = Math.max(1, Math.ceil(activeOrders.length / ITEMS_PER_PAGE));

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [totalPages]);

  const pageOrders = activeOrders.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>☕ Tres Bros Caffè</Text>
        <Text style={styles.subtitle}>Antrian Pesanan</Text>
      </View>

      <FlatList
        data={pageOrders}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isInProgress = item.status === ORDER_STATUS.IN_PROGRESS;
          return (
            <View style={[styles.card, isInProgress && styles.cardInProgress]}>
              <Text style={styles.queueNumber}>#{item.queueNumber}</Text>
              <View style={styles.itemsPreview}>
                {item.items?.slice(0, 2).map((i, idx) => (
                  <Text key={idx} style={styles.itemText} numberOfLines={1}>
                    {i.quantity}x {i.product?.name}
                  </Text>
                ))}
                {(item.items?.length ?? 0) > 2 && (
                  <Text style={styles.moreText}>+{(item.items?.length ?? 0) - 2}</Text>
                )}
              </View>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              <View style={[styles.statusDot, { backgroundColor: isInProgress ? Colors.statusInProgress : Colors.statusQueue }]} />
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {activeOrders.length} pesanan aktif
        </Text>
        <Text style={styles.footerPage}>
          {page + 1} / {totalPages}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  header: { padding: Spacing.xl, alignItems: 'center' },
  title: { ...Typography.title, color: Colors.cream, fontSize: 28 },
  subtitle: { ...Typography.body, color: Colors.zinc400, marginTop: Spacing.xs },
  list: { padding: Spacing.lg, gap: Spacing.md },
  row: { gap: Spacing.md },
  card: {
    flex: 1,
    backgroundColor: Colors.zinc800,
    borderRadius: Shape.borderRadius.xl,
    padding: Spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.statusQueue,
    minHeight: 120,
  },
  cardInProgress: {
    borderLeftColor: Colors.statusInProgress,
    backgroundColor: Colors.zinc900,
  },
  queueNumber: {
    fontFamily: 'Outfit-Bold',
    fontSize: 32,
    color: Colors.cream,
    marginBottom: Spacing.sm,
  },
  itemsPreview: { gap: 2, marginBottom: Spacing.sm },
  itemText: { ...Typography.body, color: Colors.zinc400 },
  moreText: { ...Typography.caption, color: Colors.zinc500 },
  time: { ...Typography.caption, color: Colors.zinc500 },
  statusDot: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: { ...Typography.body, color: Colors.zinc500 },
  footerPage: { ...Typography.body, color: Colors.zinc500 },
});
