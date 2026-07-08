import { client } from './client';

export interface DashboardResponse {
  revenue: number;
  expenses: number;
  netProfit: number;
  orders: number;
  itemsSold: number;
  paymentBreakdown: { CASH: number; QRIS: number; DEBIT: number };
  topProducts: { name: string; qty: number }[];
  recentOrders: any[];
  chartData: { date?: string; time?: string; revenue: number; expense: number }[];
  allOrders: { id: string; date: string; description: string; amount: number; type: string }[];
  allIncomes: { id: string; date: string; description: string; amount: number; type: string }[];
  allExpenses: { id: string; date: string; description: string; amount: number; type: string }[];
}

export const dashboardApi = {
  getData: (filter?: string) => {
    const params = filter ? { filter } : {};
    return client.get<DashboardResponse>('/api/dashboard', { params }).then((r) => r.data);
  },
};
