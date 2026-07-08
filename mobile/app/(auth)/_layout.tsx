import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.zinc50 },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
