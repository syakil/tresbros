import { client } from './client';
import type { Coupon } from '@/types/models';
import type { ValidateCouponRequest, ValidateCouponResponse } from '@/types/api';

export const couponsApi = {
  getAll: () => client.get<Coupon[]>('/api/coupons').then((r) => r.data),

  getById: (id: number) =>
    client.get<Coupon>(`/api/coupons/${id}`).then((r) => r.data),

  create: (data: Partial<Coupon>) =>
    client.post<Coupon>('/api/coupons', data).then((r) => r.data),

  update: (id: number, data: Partial<Coupon>) =>
    client.put(`/api/coupons/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/coupons/${id}`).then((r) => r.data),

  validate: (data: ValidateCouponRequest) =>
    client.post<ValidateCouponResponse>('/api/coupons/validate', data).then((r) => r.data),
};
