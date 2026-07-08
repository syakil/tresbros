import { client } from './client';

export interface ProductResponse {
  id: number;
  name: string;
  price: number;
  category: string;
  availableCount: number | null;
  missingMaterials: string[];
}

export interface ProductCreateRequest {
  name: string;
  price: number;
  category: string;
}

export const productsApi = {
  getAll: () =>
    client.get<ProductResponse[]>('/api/products').then((r) => r.data),

  getById: (id: number) =>
    client.get<ProductResponse>(`/api/products/${id}`).then((r) => r.data),

  create: (data: ProductCreateRequest) =>
    client.post<ProductResponse>('/api/products', data).then((r) => r.data),

  update: (id: number, data: Partial<ProductCreateRequest>) =>
    client.put(`/api/products/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/products/${id}`).then((r) => r.data),
};
