import { client } from './client';

export interface IncomeResponse {
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

export const incomesApi = {
  getAll: () =>
    client.get<IncomeResponse[]>('/api/incomes').then((r) => r.data),

  getById: (id: number) =>
    client.get<IncomeResponse>(`/api/incomes/${id}`).then((r) => r.data),

  create: (data: {
    description: string;
    amount: number;
    date?: string;
    accountId?: number;
    paymentAccountId?: number;
    imageUrl?: string;
  }) => client.post<IncomeResponse>('/api/incomes', data).then((r) => r.data),

  update: (id: number, data: Partial<IncomeResponse>) =>
    client.put(`/api/incomes/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/incomes/${id}`).then((r) => r.data),
};
