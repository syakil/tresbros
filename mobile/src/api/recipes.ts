import { client } from './client';
import type { RecipeItem } from '@/types/models';

export const recipesApi = {
  getAll: (productId?: number) => {
    const params = productId ? { productId } : {};
    return client.get<RecipeItem[]>('/api/recipes', { params }).then((r) => r.data);
  },

  create: (data: Partial<RecipeItem>) =>
    client.post<RecipeItem>('/api/recipes', data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/recipes/${id}`).then((r) => r.data),
};
