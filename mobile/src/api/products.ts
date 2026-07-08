import { client } from './client';
import type { Product } from '@/types/models';

export const productsApi = {
  getAll: () => client.get<Product[]>('/api/products').then((r) => r.data),

  getById: (id: number) =>
    client.get<Product>(`/api/products/${id}`).then((r) => r.data),

  create: (data: Partial<Product>) =>
    client.post<Product>('/api/products', data).then((r) => r.data),

  update: (id: number, data: Partial<Product>) =>
    client.put(`/api/products/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/products/${id}`).then((r) => r.data),
};
