import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { getInitials } from '@/utils/format';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  dark?: boolean;
  showBack?: boolean;
}

export function Header({ title, subtitle, rightAction, dark = false, showBack = false }: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const textColor = dark ? Colors.cream : Colors.zinc900;
  const subColor = dark ? Colors.zinc400 : Colors.zinc500;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: textColor }]}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.right}>
        {rightAction}
        {!showBack && user && (
          <View style={[styles.avatar, dark && { backgroundColor: Colors.brown }]}>
            <Text style={styles.avatarText}>{getInitials(user.fullName || user.username)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.olive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
});
