import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export function Payment({ route, navigation }: any) {
  const { paymentUrl } = route.params;

  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: paymentUrl }} 
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator 
            color="#2563EB" 
            size="large" 
            style={styles.loading}
          />
        )}
        onNavigationStateChange={(navState) => {
            // Kita bisa mengecek apakah user sudah kembali dari Midtrans (redirect ke mock URL, atau pengecekan params).
            // Karena tidak ada setting spesifik, user bisa klik tombol "Back" di header navigation atau tombol dalam WebView Midtrans
            console.log(navState.url);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  }
});
