import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Coffee, ChefHat } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

export function Home() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  
  return (
    <View className="flex-1 bg-brand-dark items-center justify-center px-6">
      <View className="items-center mb-12">
        <Coffee size={64} color="#2563EB" className="mb-4" />
        <Text className="text-4xl font-bold text-brand-cream text-center tracking-tight">
          Tres Bros Caffè
        </Text>
        <Text className="text-brand-sage text-base mt-2 text-center">
          Sistem POS & Kitchen Display System
        </Text>
      </View>

      <View className="w-full flex-col space-y-4 gap-4">
        <TouchableOpacity 
          className="bg-brand-olive px-6 py-4 rounded-xl flex-row items-center justify-center mb-4"
          onPress={() => navigation.navigate('Kasir (POS)')}
        >
          <Coffee size={24} color="#FFFFFF" />
          <Text className="text-brand-cream font-bold text-lg ml-3">
            Masuk Kasir (POS)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-brand-warm px-6 py-4 rounded-xl flex-row items-center justify-center"
          onPress={() => navigation.navigate('Dapur (KDS)')}
        >
          <ChefHat size={24} color="#FFFFFF" />
          <Text className="text-brand-cream font-bold text-lg ml-3">
            Masuk Dapur (KDS)
          </Text>
        </TouchableOpacity>


      </View>
    </View>
  );
}
