import { client } from './client';
import type { Category } from '@/types/models';

export const categoriesApi = {
  getAll: () => client.get<Category[]>('/api/categories').then((r) => r.data),
};
