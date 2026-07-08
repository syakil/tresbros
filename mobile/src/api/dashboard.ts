import { client } from './client';
import type { DashboardData } from '@/types/models';

export const dashboardApi = {
  getData: () =>
    client.get<DashboardData>('/api/dashboard').then((r) => r.data),
};
