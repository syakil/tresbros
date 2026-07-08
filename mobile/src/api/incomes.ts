import { client } from './client';
import type { Income } from '@/types/models';

export const incomesApi = {
  getAll: () => client.get<Income[]>('/api/incomes').then((r) => r.data),

  getById: (id: number) =>
    client.get<Income>(`/api/incomes/${id}`).then((r) => r.data),

  create: (data: Partial<Income>) =>
    client.post<Income>('/api/incomes', data).then((r) => r.data),

  update: (id: number, data: Partial<Income>) =>
    client.put(`/api/incomes/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/incomes/${id}`).then((r) => r.data),
};
