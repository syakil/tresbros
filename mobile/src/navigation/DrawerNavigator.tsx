import React from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Home } from '../app/Home';
import { Dashboard } from '../app/Dashboard';
import { Pos } from '../app/Pos';
import { Kds } from '../app/Kds';
import { Payment } from '../app/Payment';
import { Login } from '../app/Login';
import { useAuthStore } from '../store/useAuthStore';
import { Home as HomeIcon, BarChart3, ShoppingBag, ChefHat, LogOut } from 'lucide-react-native';

const Drawer = createDrawerNavigator();

export function DrawerNavigator() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!token) {
    return (
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          swipeEnabled: false,
        }}
      >
        <Drawer.Screen name="Login" component={Login} />
      </Drawer.Navigator>
    );
  }

  return (
    <Drawer.Navigator
      initialRouteName="Beranda"
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <View className="p-6 border-b border-white/5 mb-4">
              <Text className="text-brand-cream font-bold text-lg">Tres Bros Caffè</Text>
              <Text className="text-brand-sage text-xs mt-1">Logged in as {user?.fullName || 'Staf'}</Text>
            </View>
            <DrawerItemList {...props} />
          </View>
          <View className="p-4 border-t border-white/5 mb-4">
            <DrawerItem
              label="Keluar (Logout)"
              labelStyle={{ color: '#EF4444', fontSize: 16 }}
              icon={({ size }) => <LogOut size={size} color="#EF4444" />}
              onPress={() => logout()}
            />
          </View>
        </DrawerContentScrollView>
      )}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#18181B', // Zinc 900
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF', // White
        drawerStyle: {
          backgroundColor: '#18181B', // Zinc 900
          width: 280,
        },
        drawerActiveBackgroundColor: 'rgba(37, 99, 235, 0.15)', // Blue 600 translucent
        drawerActiveTintColor: '#FFFFFF',
        drawerInactiveTintColor: 'rgba(161, 161, 170, 0.8)', // Zinc 400 translucent
        drawerLabelStyle: {
          marginLeft: -15,
          fontFamily: 'sans-serif',
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen 
        name="Beranda" 
        component={Home} 
        options={{
          drawerIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
          headerTitle: 'Beranda'
        }}
      />
      <Drawer.Screen 
        name="Kasir (POS)" 
        component={Pos} 
        options={{
          drawerIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          headerTitle: 'Kasir POS'
        }}
      />
      <Drawer.Screen 
        name="Dapur (KDS)" 
        component={Kds} 
        options={{
          drawerIcon: ({ color, size }) => <ChefHat size={size} color={color} />,
          headerTitle: 'Dapur KDS'
        }}
      />
      <Drawer.Screen 
        name="Laporan Penjualan" 
        component={Dashboard} 
        options={{
          drawerIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          headerTitle: 'Dashboard'
        }}
      />
      <Drawer.Screen 
        name="Payment" 
        component={Payment} 
        options={{
          drawerItemStyle: { display: 'none' },
          headerTitle: 'Pembayaran Midtrans'
        }}
      />
    </Drawer.Navigator>
  );
}
