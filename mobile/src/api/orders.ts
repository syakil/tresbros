import { client } from './client';
import type { CreateOrderRequest } from '@/types/api';

export interface OrderItemResponse {
  id: number;
  orderId: number;
  productId: number;
  product?: { id: number; name: string; price: number };
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  queueNumber: number;
  customerName?: string;
  totalAmount: number;
  status: string;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: string;
  paymentUrl?: string;
  snapToken?: string;
  paymentStatus?: string;
  createdAt: string;
  items: OrderItemResponse[];
}

export const ordersApi = {
  getAll: () => client.get<OrderResponse[]>('/api/orders').then((r) => r.data),

  getById: (id: number) =>
    client.get<OrderResponse>(`/api/orders/${id}`).then((r) => r.data),

  create: (data: CreateOrderRequest) => {
    return client
      .post<OrderResponse>('/api/orders', {
        customerName: data.customerName || null,
        paymentMethod: data.paymentMethod || 'CASH',
        couponCode: data.couponCode || null,
        discountAmount: data.discountAmount || 0,
        totalAmount: data.totalAmount,
        items: data.items.map((i) => ({
          id: i.productId,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes || null,
        })),
      })
      .then((r) => r.data);
  },

  updateStatus: (id: number, status: string) =>
    client.patch(`/api/orders/${id}`, { status }).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/orders/${id}`).then((r) => r.data),
};
