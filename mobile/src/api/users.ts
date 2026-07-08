import { client } from './client';
import type { User } from '@/types/models';

export const usersApi = {
  getAll: () => client.get<User[]>('/api/users').then((r) => r.data),

  getById: (id: number) =>
    client.get<User>(`/api/users/${id}`).then((r) => r.data),

  create: (data: Partial<User>) =>
    client.post<User>('/api/users', data).then((r) => r.data),

  update: (id: number, data: Partial<User>) =>
    client.put(`/api/users/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/users/${id}`).then((r) => r.data),
};
