import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Coffee, KeyRound, User } from 'lucide-react-native';
import { api } from '../lib/api';
import { useNavigation } from '@react-navigation/native';

export function Login() {
  const navigation = useNavigation<any>();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Peringatan', 'Username dan password wajib diisi!');
      return;
    }
    
    setLoading(true);
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const res = await api.post('/auth/login', {
        username: trimmedUsername,
        password: trimmedPassword,
      });

      if (res.data.success && res.data.token) {
        setAuth(res.data.token, res.data.user);
        Alert.alert('Sukses', `Selamat datang kembali, ${res.data.user.fullName || username}!`);
        // Navigate to Beranda
        navigation.replace('Beranda');
      } else {
        Alert.alert('Gagal', 'Kredensial tidak valid.');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        'Gagal Login',
        err.response?.data?.error || 'Gagal terhubung ke server. Pastikan server lokal Anda aktif.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-brand-dark justify-center px-6">
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-full bg-brand-warm/20 items-center justify-center border border-brand-warm/30 mb-4">
          <Coffee size={36} color="#2563EB" />
        </View>
        <Text className="text-3xl font-bold text-brand-cream text-center tracking-tight">
          Tres Bros Caffè
        </Text>
        <Text className="text-brand-sage text-sm mt-1 text-center">
          Silakan masuk untuk mengakses sistem POS & KDS
        </Text>
      </View>

      <View className="bg-brand-olive/40 border border-white/5 rounded-3xl p-5 gap-4">
        {/* Username */}
        <View className="flex-col gap-1.5">
          <Text className="text-brand-cream font-medium text-xs uppercase tracking-wider">Username</Text>
          <View className="flex-row items-center bg-black/40 border border-white/10 rounded-xl px-4 py-1">
            <User size={18} color="#A1A1AA" />
            <TextInput
              placeholder="Masukkan username..."
              placeholderTextColor="#A1A1AA"
              className="flex-1 text-brand-cream ml-3 h-11 py-0"
              underlineColorAndroid="transparent"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        </View>

        {/* Password */}
        <View className="flex-col gap-1.5">
          <Text className="text-brand-cream font-medium text-xs uppercase tracking-wider">Password</Text>
          <View className="flex-row items-center bg-black/40 border border-white/10 rounded-xl px-4 py-1">
            <KeyRound size={18} color="#A1A1AA" />
            <TextInput
              placeholder="Masukkan password..."
              placeholderTextColor="#A1A1AA"
              className="flex-1 text-brand-cream ml-3 h-11 py-0"
              underlineColorAndroid="transparent"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          className="bg-brand-warm py-4 rounded-xl items-center justify-center mt-3 active:scale-[0.98]"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-brand-cream font-bold text-base">Masuk</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
