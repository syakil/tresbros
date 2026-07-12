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
    client.get<MaterialResponse[]>('/api/Material').then((r) => r.data),

  getById: (id: number) =>
    client.get<MaterialResponse>(`/api/Material/${id}`).then((r) => r.data),

  create: (data: MaterialCreateRequest) =>
    client.post<MaterialResponse>('/api/Material', data).then((r) => r.data),

  update: (id: number, data: MaterialUpdateRequest) =>
    client.put(`/api/Material/${id}`, data).then((r) => r.data),

  adjust: (id: number, data: { adjustType: 'in' | 'out'; quantity: number; totalPrice: number; notes: string }) =>
    client.post<MaterialResponse>(`/api/Material/${id}/adjust`, data).then((r) => r.data),

  getBatches: (id: number) =>
    client.get(`/api/Material/${id}/batches`).then((r) => r.data),

  updateBatch: (batchId: number, data: Record<string, unknown>) =>
    client.put(`/api/Material/batches/${batchId}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/Material/${id}`).then((r) => r.data),
};
