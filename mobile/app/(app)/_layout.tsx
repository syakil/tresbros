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
      <Stack.Screen
        name="admin/items"
        options={{ headerShown: true, title: 'Produk', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/recipes"
        options={{ headerShown: true, title: 'Resep', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/inventory"
        options={{ headerShown: true, title: 'Inventori', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/purchases"
        options={{ headerShown: true, title: 'Pembelian', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/expenses"
        options={{ headerShown: true, title: 'Pengeluaran', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/incomes"
        options={{ headerShown: true, title: 'Pendapatan', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/coupons"
        options={{ headerShown: true, title: 'Kupon', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/users"
        options={{ headerShown: true, title: 'Pengguna', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/roles"
        options={{ headerShown: true, title: 'Role', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/settings"
        options={{ headerShown: true, title: 'Pengaturan', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/accounting/coa"
        options={{ headerShown: true, title: 'Chart of Accounts', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/accounting/journals"
        options={{ headerShown: true, title: 'Jurnal', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/accounting/ledger"
        options={{ headerShown: true, title: 'Buku Besar', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/accounting/profit-loss"
        options={{ headerShown: true, title: 'Laba Rugi', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/rnd/index"
        options={{ headerShown: true, title: 'R&D', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="admin/rnd/[id]"
        options={{ headerShown: true, title: 'Detail R&D', headerTintColor: Colors.olive }}
      />
      <Stack.Screen
        name="orders/[id]"
        options={{ headerShown: true, title: 'Detail Order', headerTintColor: Colors.olive }}
      />
    </Stack>
  );
}
