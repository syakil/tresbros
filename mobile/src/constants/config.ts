import Constants from 'expo-constants';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_URL =
  ENV_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  'https://tres.syakil-dev.my.id';

export const APP_NAME = 'Tres Bros Caffè';

export const ROLES = {
  ADMIN: 'ADMIN',
  KASIR: 'KASIR',
  OWNER: 'OWNER',
  GUDANG: 'GUDANG',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  POS: 'pos',
  KDS: 'kds',
  DASHBOARD: 'dashboard',
  ACCOUNTING: 'accounting',
  INVENTORY: 'inventory',
  PURCHASES: 'purchases',
  SETTINGS: 'settings',
} as const;

export const ORDER_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  TAKEN: 'TAKEN',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  QRIS: 'QRIS',
  DEBIT: 'DEBIT',
  MIDTRANS: 'MIDTRANS',
} as const;

export const ITEM_TYPES = {
  RAW: 'RAW',
  SUB_RECIPE: 'SUB_RECIPE',
  PRODUCT: 'PRODUCT',
} as const;
