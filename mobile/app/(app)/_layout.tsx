import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/theme/colors';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.zinc50 },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin/items" />
      <Stack.Screen name="admin/recipes" />
      <Stack.Screen name="admin/inventory" />
      <Stack.Screen name="admin/purchases" />
      <Stack.Screen name="admin/expenses" />
      <Stack.Screen name="admin/incomes" />
      <Stack.Screen name="admin/coupons" />
      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/roles" />
      <Stack.Screen name="admin/settings" />
      <Stack.Screen name="admin/stock-opname" />
      <Stack.Screen name="admin/accounting/coa" />
      <Stack.Screen name="admin/accounting/journals" />
      <Stack.Screen name="admin/accounting/ledger" />
      <Stack.Screen name="admin/accounting/profit-loss" />
      <Stack.Screen name="admin/rnd/index" />
      <Stack.Screen name="admin/rnd/[id]" />
      <Stack.Screen name="orders/[id]" />
    </Stack>
  );
}
