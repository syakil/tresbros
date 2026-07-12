import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

import { usePrinterStore } from '@/store/usePrinterStore';
import { printReceipt } from '@/services/printerService';



export default function MoreScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const printer = usePrinterStore();
  const [showPrinterModal, setShowPrinterModal] = useState(false);

  useEffect(() => {
    printer.init();
  }, []);



  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleTestPrint = async () => {
    try {
      const connected = await printer.connect();
      if (!connected) {
        Alert.alert("Gagal", "Tidak dapat terhubung ke printer. Pastikan Bluetooth aktif dan printer menyala.");
        return;
      }
      
      const dummyOrder = {
        queueNumber: 99,
        orderNumber: 'TEST12345678',
        createdAt: new Date().toISOString(),
        customerName: 'Tester Printer',
        paymentMethod: 'CASH',
        totalAmount: 15000,
        items: [
          {
            product: { name: 'Kopi Susu Es' },
            price: 15000,
            quantity: 1,
            notes: 'Less Sugar'
          }
        ]
      };
      
      await printReceipt(dummyOrder, 'TRES BROS CAFFE');
      Alert.alert("Sukses", "Struk uji coba berhasil dikirim ke printer.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal mencetak struk uji coba.");
    }
  };

  const handleScanAndOpenModal = async () => {
    setShowPrinterModal(true);
    try {
      await printer.scan();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal mencari perangkat bluetooth.");
    }
  };

  const handleSelectDevice = async (device: any) => {
    await printer.selectPrinter(device);
    setShowPrinterModal(false);
    Alert.alert("Sukses", `Printer ${device.name} berhasil dipilih.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Menu" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0) ?? user?.username?.charAt(0) ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.fullName ?? user?.username}</Text>
              <Text style={styles.userRole}>{user?.role?.name}</Text>
            </View>
          </View>
        </Card>

        {/* Printer Configuration Card */}
        <Card variant="outlined" style={styles.printerCard}>
          <Text style={styles.sectionHeader}>🖨️ Pengaturan Printer Struk</Text>
          {printer.selectedPrinter ? (
            <View style={styles.printerInfoRow}>
              <View style={styles.printerDetails}>
                <Text style={styles.printerName}>{printer.selectedPrinter.name}</Text>
                <Text style={styles.printerAddr}>{printer.selectedPrinter.address}</Text>
              </View>
              <View style={styles.printerActionButtons}>
                <TouchableOpacity onPress={handleTestPrint} style={styles.testBtn}>
                  <Text style={styles.testBtnText}>Test Print</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => printer.selectPrinter(null)} style={styles.disconnectBtn}>
                  <Text style={styles.disconnectBtnText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.printerSetupRow}>
              <Text style={styles.printerSetupText}>Printer Bluetooth belum dikonfigurasi.</Text>
              <TouchableOpacity onPress={handleScanAndOpenModal} style={styles.setupBtn}>
                <Text style={styles.setupBtnText}>Cari Printer</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Stok Opname */}
        <TouchableOpacity
          style={styles.opnameCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(app)/admin/stock-opname' as any)}
        >
          <View style={styles.opnameLeft}>
            <Text style={styles.opnameIcon}>📋</Text>
            <View>
              <Text style={styles.opnameTitle}>Stok Opname</Text>
              <Text style={styles.opnameDesc}>Hitung & sesuaikan stok bahan baku</Text>
            </View>
          </View>
          <Text style={styles.opnameArrow}>›</Text>
        </TouchableOpacity>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button title="Keluar" variant="danger" onPress={handleLogout} fullWidth />
        </View>
      </ScrollView>

      {/* Bluetooth Printer Scan Modal */}
      <Modal
        visible={showPrinterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Printer Bluetooth</Text>
              <TouchableOpacity onPress={() => setShowPrinterModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {printer.isScanning ? (
              <View style={styles.scanLoading}>
                <Text style={styles.loadingText}>Mencari printer thermal...</Text>
              </View>
            ) : (
              <ScrollView style={styles.deviceList}>
                <Text style={styles.deviceListHeader}>Perangkat Berpasangan (Paired):</Text>
                {printer.pairedDevices.length === 0 ? (
                  <Text style={styles.emptyDeviceText}>Tidak ada perangkat paired</Text>
                ) : (
                  printer.pairedDevices.map((dev, idx) => (
                    <TouchableOpacity
                      key={`paired-${idx}`}
                      style={styles.deviceRow}
                      onPress={() => handleSelectDevice(dev)}
                    >
                      <Text style={styles.deviceNameText}>{dev.name}</Text>
                      <Text style={styles.deviceAddressText}>{dev.address}</Text>
                    </TouchableOpacity>
                  ))
                )}

                <Text style={[styles.deviceListHeader, { marginTop: Spacing.md }]}>Perangkat Baru Ditemukan:</Text>
                {printer.foundDevices.length === 0 ? (
                  <Text style={styles.emptyDeviceText}>Tidak ada perangkat baru ditemukan</Text>
                ) : (
                  printer.foundDevices.map((dev, idx) => (
                    <TouchableOpacity
                      key={`found-${idx}`}
                      style={styles.deviceRow}
                      onPress={() => handleSelectDevice(dev)}
                    >
                      <Text style={styles.deviceNameText}>{dev.name}</Text>
                      <Text style={styles.deviceAddressText}>{dev.address}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={[styles.scanBtn, printer.isScanning && styles.scanBtnDisabled]} 
              disabled={printer.isScanning}
              onPress={() => printer.scan().catch((e) => Alert.alert("Error", e.message))}
            >
              <Text style={styles.scanBtnText}>{printer.isScanning ? "Memindai..." : "Scan Ulang"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing['4xl'] },
  userCard: {
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.base,
    padding: Spacing.base,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.olive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.title,
    color: Colors.white,
  },
  userName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.zinc900,
  },
  userRole: {
    ...Typography.caption,
    color: Colors.zinc500,
  },
  sectionHeader: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: Colors.zinc800,
    marginBottom: Spacing.sm,
  },
  printerCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderColor: Colors.zinc200,
    borderWidth: 1,
  },
  printerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  printerDetails: {
    flex: 1,
  },
  printerName: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.zinc800,
  },
  printerAddr: {
    ...Typography.caption,
    color: Colors.zinc500,
    marginTop: 2,
  },
  printerActionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  testBtn: {
    backgroundColor: Colors.olive,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
  },
  testBtnText: {
    ...Typography.captionMedium,
    color: Colors.white,
    fontWeight: '600',
  },
  disconnectBtn: {
    backgroundColor: Colors.zinc100,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Shape.borderRadius.md,
  },
  disconnectBtnText: {
    ...Typography.captionMedium,
    color: Colors.zinc600,
  },
  printerSetupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  printerSetupText: {
    ...Typography.bodyMedium,
    color: Colors.zinc500,
    flex: 1,
    marginRight: Spacing.sm,
  },
  setupBtn: {
    backgroundColor: Colors.olive,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Shape.borderRadius.xl,
  },
  setupBtnText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: '600',
  },
  opnameCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shape.shadow.sm,
  },
  opnameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  opnameIcon: {
    fontSize: 28,
  },
  opnameTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.zinc900,
  },
  opnameDesc: {
    ...Typography.caption,
    color: Colors.zinc500,
    marginTop: 2,
  },
  opnameArrow: {
    fontSize: 24,
    color: Colors.zinc400,
    fontWeight: '300',
  },
  logoutContainer: {
    padding: Spacing.base,
  },
  
  // Modal scan printer styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Shape.borderRadius.xl,
    borderTopRightRadius: Shape.borderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.base,
  },
  modalTitle: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
    color: Colors.zinc800,
  },
  closeModalBtn: {
    padding: Spacing.xs,
  },
  closeModalText: {
    fontSize: 18,
    color: Colors.zinc400,
  },
  scanLoading: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.zinc500,
  },
  deviceList: {
    marginBottom: Spacing.base,
  },
  deviceListHeader: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.zinc600,
    marginBottom: Spacing.xs,
  },
  emptyDeviceText: {
    ...Typography.caption,
    color: Colors.zinc400,
    paddingVertical: Spacing.xs,
    fontStyle: 'italic',
  },
  deviceRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  deviceNameText: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    color: Colors.zinc800,
  },
  deviceAddressText: {
    ...Typography.caption,
    color: Colors.zinc500,
    marginTop: 2,
  },
  scanBtn: {
    backgroundColor: Colors.olive,
    borderRadius: Shape.borderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnDisabled: {
    opacity: 0.6,
  },
  scanBtnText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: 'bold',
  }
});
