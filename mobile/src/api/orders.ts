import { client } from './client';
import type { Order } from '@/types/models';
import type { CreateOrderRequest } from '@/types/api';

export const ordersApi = {
  getAll: () => client.get<Order[]>('/api/orders').then((r) => r.data),

  getById: (id: number) =>
    client.get<Order>(`/api/orders/${id}`).then((r) => r.data),

  create: (data: CreateOrderRequest) =>
    client.post<Order>('/api/orders', data).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    client.patch(`/api/orders/${id}`, { status }).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/orders/${id}`).then((r) => r.data),
};
