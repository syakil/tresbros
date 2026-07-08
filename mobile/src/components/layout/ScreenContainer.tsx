import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  dark?: boolean;
  statusBarStyle?: 'light' | 'dark';
}

export function ScreenContainer({
  children,
  scrollable = true,
  padded = true,
  style,
  dark = false,
  statusBarStyle,
}: ScreenContainerProps) {
  const bgColor = dark ? Colors.dark : Colors.zinc50;
  const Content = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={['top']}>
      <StatusBar style={statusBarStyle ?? (dark ? 'light' : 'dark')} />
      <Content
        style={[styles.content, { backgroundColor: bgColor }, style]}
        contentContainerStyle={
          scrollable && padded ? { padding: Spacing.base } : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Content>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
