import { client } from './client';

export interface RecipeItemResponse {
  id: number;
  productId: number;
  materialId: number;
  material?: { id: number; name: string; stock: number; unit: string; costPerUnit: number };
  quantity: number;
}

export const recipesApi = {
  getAll: (productId: number) =>
    client
      .get<RecipeItemResponse[]>('/api/recipes', { params: { productId } })
      .then((r) => r.data),

  create: (data: { productId: number; materialId: number; quantity: number }) =>
    client.post<RecipeItemResponse>('/api/recipes', data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/recipes/${id}`).then((r) => r.data),
};
