import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  borderColor?: string;
  bgColor?: string;
  iconBgColor?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  borderColor = 'border-l-green-500', 
  bgColor = 'bg-brand-olive',
  iconBgColor = 'bg-green-500/20'
}: MetricCardProps) {
  return (
    <View className={`p-5 rounded-xl shadow-sm mb-4 border-l-4 ${borderColor} ${bgColor}`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className={`w-10 h-10 rounded-full items-center justify-center ${iconBgColor}`}>
          {icon}
        </View>
        <View className="bg-black/20 px-2 py-1 rounded">
          <Text className="text-xs text-brand-sage font-medium">{title}</Text>
        </View>
      </View>
      <View>
        {subtitle && <Text className="text-brand-sage text-xs mb-1 font-medium">{subtitle}</Text>}
        <Text className="text-3xl font-bold text-white tracking-tight">{value}</Text>
      </View>
    </View>
  );
}
