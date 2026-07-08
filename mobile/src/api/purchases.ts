import { client } from './client';

export interface PurchaseItemResponse {
  id: number;
  purchaseId: number;
  materialId: number;
  material?: { id: number; name: string; unit: string };
  quantity: number;
  price: number;
}

export interface PurchaseResponse {
  id: number;
  purchaseNo: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  receiptUrl?: string;
  createdAt: string;
  items: PurchaseItemResponse[];
}

export interface CreatePurchaseRequest {
  supplierName: string;
  items: { materialId: number; quantity: number; price: number }[];
  receiptBase64?: string;
  receiptFileName?: string;
}

export const purchasesApi = {
  getAll: () =>
    client.get<PurchaseResponse[]>('/api/purchases').then((r) => r.data),

  getById: (id: number) =>
    client.get<PurchaseResponse>(`/api/purchases/${id}`).then((r) => r.data),

  create: (data: CreatePurchaseRequest) =>
    client.post<PurchaseResponse>('/api/purchases', data).then((r) => r.data),

  cancel: (id: number) =>
    client.patch(`/api/purchases/${id}`).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/purchases/${id}`).then((r) => r.data),
};
