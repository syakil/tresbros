import { client } from './client';
import type { Purchase } from '@/types/models';
import type { CreatePurchaseRequest } from '@/types/api';

export const purchasesApi = {
  getAll: () => client.get<Purchase[]>('/api/purchases').then((r) => r.data),

  getById: (id: number) =>
    client.get<Purchase>(`/api/purchases/${id}`).then((r) => r.data),

  create: (data: CreatePurchaseRequest) =>
    client.post<Purchase>('/api/purchases', data).then((r) => r.data),

  cancel: (id: number) =>
    client.patch(`/api/purchases/${id}`).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/purchases/${id}`).then((r) => r.data),
};
