import { client } from './client';

export interface ExpenseResponse {
  id: number;
  description: string;
  amount: number;
  imageUrl?: string;
  date: string;
  accountId: number;
  paymentAccountId: number;
  account?: { id: number; code: string; name: string };
  paymentAccount?: { id: number; code: string; name: string };
}

export const expensesApi = {
  getAll: () =>
    client.get<ExpenseResponse[]>('/api/expenses').then((r) => r.data),

  getById: (id: number) =>
    client.get<ExpenseResponse>(`/api/expenses/${id}`).then((r) => r.data),

  create: (data: {
    description: string;
    amount: number;
    date?: string;
    accountId?: number;
    paymentAccountId?: number;
    imageUrl?: string;
  }) => client.post<ExpenseResponse>('/api/expenses', data).then((r) => r.data),

  update: (id: number, data: Partial<ExpenseResponse>) =>
    client.put(`/api/expenses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/expenses/${id}`).then((r) => r.data),
};
