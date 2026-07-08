import { client } from './client';
import type { Expense } from '@/types/models';

export const expensesApi = {
  getAll: () => client.get<Expense[]>('/api/expenses').then((r) => r.data),

  getById: (id: number) =>
    client.get<Expense>(`/api/expenses/${id}`).then((r) => r.data),

  create: (data: Partial<Expense>) =>
    client.post<Expense>('/api/expenses', data).then((r) => r.data),

  update: (id: number, data: Partial<Expense>) =>
    client.put(`/api/expenses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/expenses/${id}`).then((r) => r.data),
};
