import { client } from './client';
import type { RnDRecipe } from '@/types/models';
import type { PromoteRnDRequest } from '@/types/api';

export const rndApi = {
  getAll: () => client.get<RnDRecipe[]>('/api/rnd').then((r) => r.data),

  getById: (id: number) =>
    client.get<RnDRecipe>(`/api/rnd/${id}`).then((r) => r.data),

  create: (data: Partial<RnDRecipe>) =>
    client.post<RnDRecipe>('/api/rnd', data).then((r) => r.data),

  update: (id: number, data: Partial<RnDRecipe>) =>
    client.put(`/api/rnd/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/rnd/${id}`).then((r) => r.data),

  test: (id: number) =>
    client.post(`/api/rnd/${id}/test`).then((r) => r.data),

  promote: (id: number, data: PromoteRnDRequest) =>
    client.post(`/api/rnd/${id}/promote`, data).then((r) => r.data),

  updateHistory: (historyId: number, notes: string) =>
    client.put(`/api/rnd/history/${historyId}`, { notes }).then((r) => r.data),

  applyHistory: (id: number, historyId: number) =>
    client.post(`/api/rnd/${id}/apply-history/${historyId}`).then((r) => r.data),
};
