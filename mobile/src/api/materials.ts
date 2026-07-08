import { client } from './client';
import type { Material, MaterialBatch } from '@/types/models';
import type { MaterialAdjustRequest } from '@/types/api';

export const materialsApi = {
  getAll: () => client.get<Material[]>('/api/materials').then((r) => r.data),

  getById: (id: number) =>
    client.get<Material>(`/api/materials/${id}`).then((r) => r.data),

  create: (data: Partial<Material>) =>
    client.post<Material>('/api/materials', data).then((r) => r.data),

  update: (id: number, data: Partial<Material>) =>
    client.put(`/api/materials/${id}`, data).then((r) => r.data),

  adjust: (id: number, data: MaterialAdjustRequest) =>
    client.put<Material>(`/api/materials/${id}/adjust`, data).then((r) => r.data),

  getBatches: (id: number) =>
    client.get<MaterialBatch[]>(`/api/materials/${id}/batches`).then((r) => r.data),

  updateBatch: (batchId: number, data: Partial<MaterialBatch>) =>
    client.put<MaterialBatch>(`/api/materials/batches/${batchId}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/materials/${id}`).then((r) => r.data),
};
