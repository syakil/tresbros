import { client } from './client';
import type { Setting } from '@/types/models';

export const settingsApi = {
  getAll: () => client.get<Setting[]>('/api/settings').then((r) => r.data),

  getByKey: (key: string) =>
    client.get<Setting>(`/api/settings/${key}`).then((r) => r.data),

  upsert: (data: Setting) =>
    client.post<Setting>('/api/settings', data).then((r) => r.data),

  reset: () =>
    client.post('/api/settings/reset').then((r) => r.data),
};
