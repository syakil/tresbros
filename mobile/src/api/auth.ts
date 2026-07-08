import { client } from './client';
import type { LoginRequest, LoginResponse } from '@/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),

  logout: () => client.post('/api/auth/logout').then((r) => r.data),
};
