import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';

interface MenuItem {
  icon: string;
  title: string;
  route: string;
  permission?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: '📦', title: 'Produk', route: '/(app)/admin/items' },
  { icon: '📋', title: 'Resep', route: '/(app)/admin/recipes' },
  { icon: '🏭', title: 'Inventori', route: '/(app)/admin/inventory', permission: 'inventory' },
  { icon: '🛒', title: 'Pembelian', route: '/(app)/admin/purchases', permission: 'purchases' },
  { icon: '💸', title: 'Pengeluaran', route: '/(app)/admin/expenses' },
  { icon: '💰', title: 'Pendapatan', route: '/(app)/admin/incomes' },
  { icon: '🏷️', title: 'Kupon', route: '/(app)/admin/coupons' },
  { icon: '👥', title: 'Pengguna', route: '/(app)/admin/users', permission: 'settings' },
  { icon: '🔐', title: 'Role', route: '/(app)/admin/roles', permission: 'settings' },
  { icon: '⚙️', title: 'Pengaturan', route: '/(app)/admin/settings', permission: 'settings' },
  { icon: '📊', title: 'Chart of Accounts', route: '/(app)/admin/accounting/coa', permission: 'accounting' },
  { icon: '📒', title: 'Jurnal', route: '/(app)/admin/accounting/journals', permission: 'accounting' },
  { icon: '📖', title: 'Buku Besar', route: '/(app)/admin/accounting/ledger', permission: 'accounting' },
  { icon: '📈', title: 'Laba Rugi', route: '/(app)/admin/accounting/profit-loss', permission: 'accounting' },
  { icon: '🧪', title: 'R&D', route: '/(app)/admin/rnd' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { has, isAdmin } = usePermissions();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return isAdmin || has(item.permission);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Menu" />

      {/* User Info */}
      <Card variant="elevated" style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) ?? user?.username?.charAt(0) ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.fullName ?? user?.username}</Text>
            <Text style={styles.userRole}>{user?.role?.name}</Text>
          </View>
        </View>
      </Card>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {visibleItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button title="Keluar" variant="danger" onPress={handleLogout} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  userCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.olive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.title,
    color: Colors.white,
  },
  userName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.zinc900,
  },
  userRole: {
    ...Typography.caption,
    color: Colors.zinc500,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  menuItem: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shape.shadow.sm,
  },
  menuIcon: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  menuTitle: {
    ...Typography.captionMedium,
    color: Colors.zinc700,
    textAlign: 'center',
  },
  logoutContainer: {
    padding: Spacing.base,
    marginTop: 'auto',
  },
});
