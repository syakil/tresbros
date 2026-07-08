import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type AdminStackParamList = {
  Items: undefined;
  Recipes: undefined;
  Inventory: undefined;
  Purchases: undefined;
  Expenses: undefined;
  Incomes: undefined;
  Coupons: undefined;
  Users: undefined;
  Roles: undefined;
  Settings: undefined;
  AccountingCOA: undefined;
  AccountingJournals: undefined;
  AccountingLedger: undefined;
  AccountingProfitLoss: undefined;
  RnD: undefined;
  RnDDetail: { id: number };
  OrderDetail: { id: number };
};

export type TabParamList = {
  Dashboard: undefined;
  POS: undefined;
  KDS: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<TabParamList>;
  Queue: undefined;
};

export type LoginScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Login'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type DashboardScreenProps = BottomTabScreenProps<TabParamList, 'Dashboard'>;
export type POSScreenProps = BottomTabScreenProps<TabParamList, 'POS'>;
export type KDSScreenProps = BottomTabScreenProps<TabParamList, 'KDS'>;
export type MoreScreenProps = BottomTabScreenProps<TabParamList, 'More'>;
