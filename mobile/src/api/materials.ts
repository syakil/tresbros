import { client } from './client';

export interface MaterialResponse {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  costPerUnit: number;
  lastUpdated: string;
}

export interface MaterialCreateRequest {
  name: string;
  unit: string;
  minStock: number;
}

export interface MaterialUpdateRequest {
  name?: string;
  unit?: string;
  minStock?: number;
}

export const materialsApi = {
  getAll: () =>
    client.get<MaterialResponse[]>('/api/materials').then((r) => r.data),

  getById: (id: number) =>
    client.get<MaterialResponse>(`/api/materials/${id}`).then((r) => r.data),

  create: (data: MaterialCreateRequest) =>
    client.post<MaterialResponse>('/api/materials', data).then((r) => r.data),

  update: (id: number, data: MaterialUpdateRequest) =>
    client.put(`/api/materials/${id}`, data).then((r) => r.data),

  adjust: (id: number, data: { adjustType: 'in' | 'out'; quantity: number; totalPrice: number; notes: string }) =>
    client.put<MaterialResponse>(`/api/materials/${id}/adjust`, data).then((r) => r.data),

  getBatches: (id: number) =>
    client.get(`/api/materials/${id}/batches`).then((r) => r.data),

  updateBatch: (batchId: number, data: Record<string, unknown>) =>
    client.put(`/api/materials/batches/${batchId}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/materials/${id}`).then((r) => r.data),
};
