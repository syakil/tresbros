import 'react-native-gesture-handler';
import "./global.css";
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <DrawerNavigator />
    </NavigationContainer>
  );
}
