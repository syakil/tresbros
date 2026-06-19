import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Home } from '../app/Home';
import { Dashboard } from '../app/Dashboard';
import { Pos } from '../app/Pos';
import { Kds } from '../app/Kds';
import { Payment } from '../app/Payment';
import { Home as HomeIcon, BarChart3, ShoppingBag, ChefHat } from 'lucide-react-native';

const Drawer = createDrawerNavigator();

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Beranda"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3A2B1F', // brand-dark
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#F3EDE1', // brand-cream
        drawerStyle: {
          backgroundColor: '#3A2B1F', // brand-dark
          width: 280,
        },
        drawerActiveBackgroundColor: 'rgba(125, 143, 106, 0.3)', // brand-sage/30
        drawerActiveTintColor: '#F3EDE1',
        drawerInactiveTintColor: 'rgba(243, 237, 225, 0.8)',
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
