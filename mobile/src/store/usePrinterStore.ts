import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform, PermissionsAndroid } from 'react-native';

const PRINTER_ADDRESS_KEY = 'selected_printer_address';
const PRINTER_NAME_KEY = 'selected_printer_name';

async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // On Android 12 (API level 31) and higher
  if (Number(Platform.Version) >= 31) {
    try {
      const connectGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Izin Koneksi Bluetooth',
          message: 'Aplikasi membutuhkan izin Bluetooth untuk mencetak struk.',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Batal',
          buttonPositive: 'OK',
        }
      );
      const scanGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: 'Izin Scan Bluetooth',
          message: 'Aplikasi membutuhkan izin Bluetooth untuk mencari printer.',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Batal',
          buttonPositive: 'OK',
        }
      );
      return (
        connectGranted === PermissionsAndroid.RESULTS.GRANTED &&
        scanGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn("Failed to request Android 12 Bluetooth permissions", err);
      return false;
    }
  } else {
    // Android 11 and below, location permission is needed for bluetooth scanning
    try {
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Izin Lokasi',
          message: 'Aplikasi membutuhkan izin lokasi untuk mendeteksi perangkat Bluetooth.',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Batal',
          buttonPositive: 'OK',
        }
      );
      return locationGranted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Failed to request location permission for Bluetooth", err);
      return false;
    }
  }
}

export interface BluetoothDevice {
  name: string;
  address: string;
}

interface PrinterState {
  pairedDevices: BluetoothDevice[];
  foundDevices: BluetoothDevice[];
  selectedPrinter: BluetoothDevice | null;
  isScanning: boolean;
  isConnected: boolean;
  isBluetoothEnabled: boolean;

  init: () => Promise<void>;
  scan: () => Promise<void>;
  selectPrinter: (device: BluetoothDevice | null) => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  checkBluetoothStatus: () => Promise<boolean>;
}

// Dynamically require native module to avoid crash on Simulator/Web
let BluetoothManager: any = null;
try {
  BluetoothManager = require('@vardrz/react-native-bluetooth-escpos-printer').BluetoothManager;
} catch (e) {
  console.warn("BluetoothManager not available. Bluetooth printing will not work on this device.", e);
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
  pairedDevices: [],
  foundDevices: [],
  selectedPrinter: null,
  isScanning: false,
  isConnected: false,
  isBluetoothEnabled: false,

  init: async () => {
    try {
      const address = await SecureStore.getItemAsync(PRINTER_ADDRESS_KEY);
      const name = await SecureStore.getItemAsync(PRINTER_NAME_KEY);
      if (address && name) {
        set({ selectedPrinter: { name, address } });
      }
      await get().checkBluetoothStatus();
    } catch (e) {
      console.error("Failed to init printer store", e);
    }
  },

  checkBluetoothStatus: async () => {
    if (!BluetoothManager) return false;
    try {
      const enabled = await BluetoothManager.isBluetoothEnabled();
      set({ isBluetoothEnabled: !!enabled });
      return !!enabled;
    } catch {
      set({ isBluetoothEnabled: false });
      return false;
    }
  },

  scan: async () => {
    if (!BluetoothManager) return;
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      throw new Error("Izin Bluetooth ditolak. Aplikasi tidak dapat mencari printer.");
    }
    set({ isScanning: true, foundDevices: [], pairedDevices: [] });
    try {
      const isEnabled = await get().checkBluetoothStatus();
      if (!isEnabled) {
        try {
          await BluetoothManager.enableBluetooth();
          set({ isBluetoothEnabled: true });
        } catch {
          set({ isScanning: false });
          throw new Error("Mohon aktifkan Bluetooth terlebih dahulu.");
        }
      }

      const scanResultStr = await BluetoothManager.scanDevices();
      let scanResult = typeof scanResultStr === 'string' ? JSON.parse(scanResultStr) : scanResultStr;
      
      const paired: BluetoothDevice[] = (scanResult.devices || []).map((d: any) => ({
        name: d.name || 'Unnamed Device',
        address: d.address
      }));
      
      const found: BluetoothDevice[] = (scanResult.found || []).map((d: any) => ({
        name: d.name || 'Unnamed Device',
        address: d.address
      }));

      set({ pairedDevices: paired, foundDevices: found, isScanning: false });
    } catch (e: any) {
      set({ isScanning: false });
      console.error("Bluetooth scan failed:", e);
      throw e;
    }
  },

  selectPrinter: async (device) => {
    if (device) {
      await SecureStore.setItemAsync(PRINTER_ADDRESS_KEY, device.address);
      await SecureStore.setItemAsync(PRINTER_NAME_KEY, device.name);
    } else {
      await SecureStore.deleteItemAsync(PRINTER_ADDRESS_KEY);
      await SecureStore.deleteItemAsync(PRINTER_NAME_KEY);
    }
    set({ selectedPrinter: device });
  },

  connect: async () => {
    const { selectedPrinter } = get();
    if (!selectedPrinter || !BluetoothManager) return false;
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      console.warn("Bluetooth permission denied on connect attempt");
      return false;
    }
    try {
      await BluetoothManager.connect(selectedPrinter.address);
      set({ isConnected: true });
      return true;
    } catch (e) {
      console.error("Failed to connect to printer:", e);
      set({ isConnected: false });
      return false;
    }
  },

  disconnect: async () => {
    if (!BluetoothManager) return;
    try {
      set({ isConnected: false });
    } catch (e) {
      console.error("Failed to disconnect:", e);
    }
  }
}));
