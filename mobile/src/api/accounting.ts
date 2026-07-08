import { client } from './client';
import type { ChartOfAccount, JournalEntry, ProfitLossData } from '@/types/models';

export const accountingApi = {
  getCOA: () =>
    client.get<ChartOfAccount[]>('/api/accounting/coa').then((r) => r.data),

  createCOA: (data: Partial<ChartOfAccount>) =>
    client.post<ChartOfAccount>('/api/accounting/coa', data).then((r) => r.data),

  updateCOA: (id: number, data: Partial<ChartOfAccount>) =>
    client.put(`/api/accounting/coa/${id}`, data).then((r) => r.data),

  deleteCOA: (id: number) =>
    client.delete(`/api/accounting/coa/${id}`).then((r) => r.data),

  getJournals: () =>
    client.get<JournalEntry[]>('/api/accounting/journals').then((r) => r.data),

  getLedger: (params: { accountId?: number; startDate?: string; endDate?: string }) =>
    client.get('/api/accounting/ledger', { params }).then((r) => r.data),

  getProfitLoss: (params: { startDate?: string; endDate?: string }) =>
    client.get<ProfitLossData>('/api/accounting/profit-loss', { params }).then((r) => r.data),
};
