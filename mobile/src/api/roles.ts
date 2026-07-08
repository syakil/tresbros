import { client } from './client';
import type { Role } from '@/types/models';

export const rolesApi = {
  getAll: () => client.get<Role[]>('/api/roles').then((r) => r.data),

  getById: (id: number) =>
    client.get<Role>(`/api/roles/${id}`).then((r) => r.data),

  create: (data: Partial<Role>) =>
    client.post<Role>('/api/roles', data).then((r) => r.data),

  update: (id: number, data: Partial<Role>) =>
    client.put(`/api/roles/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/roles/${id}`).then((r) => r.data),
};
