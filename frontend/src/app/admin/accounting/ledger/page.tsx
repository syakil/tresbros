"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function LedgerPage() {
  const [coas, setCoas] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoas();
  }, []);

  const fetchCoas = async () => {
    try {
      const res = await axios.get('/api/accounting/coa');
      setCoas(res.data);
    } catch (error) {
      console.error("Failed to fetch COAs", error);
    }
  };

  const fetchLedger = async () => {
    if (!accountId) return alert("Pilih akun terlebih dahulu!");
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append('accountId', accountId);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await axios.get(`/api/accounting/ledger?${query.toString()}`);
      setLedgerData(res.data);
    } catch (error) {
      console.error("Failed to fetch ledger", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-cream">Buku Besar</h1>
          <p className="text-brand-sage">Riwayat transaksi per akun (Ledger)</p>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-end bg-black/40 border border-white/5">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-brand-sage text-sm mb-1">Pilih Akun</label>
          <select 
            className="w-full bg-black border border-white/10 rounded-lg p-2 text-brand-cream"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">-- Pilih Akun --</option>
            {coas.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-brand-sage text-sm mb-1">Dari Tanggal</label>
          <input 
            type="date" 
            className="bg-black border border-white/10 rounded-lg p-2 text-brand-cream"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-brand-sage text-sm mb-1">Sampai Tanggal</label>
          <input 
            type="date" 
            className="bg-black border border-white/10 rounded-lg p-2 text-brand-cream"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={fetchLedger} disabled={loading}>
          {loading ? 'Memuat...' : <><Search className="w-4 h-4 mr-2" /> Cari</>}
        </Button>
      </Card>

      {ledgerData && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20">
            <h2 className="text-xl font-bold text-brand-warm">{ledgerData.account.code} - {ledgerData.account.name}</h2>
            <p className="text-brand-sage text-sm">Tipe: {ledgerData.account.type}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/40 text-brand-sage text-sm border-b border-white/5">
                <tr>
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Referensi</th>
                  <th className="p-4 font-medium">Debit</th>
                  <th className="p-4 font-medium">Kredit</th>
                  <th className="p-4 font-medium text-right">Saldo Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-brand-cream text-sm">
                {ledgerData.lines.map((line: any, i: number) => {
                  const isDebit = line.debit > 0;
                  const isCredit = line.credit > 0;
                  return (
                    <tr key={line.id} className="hover:bg-black/20 transition-colors">
                      <td className="p-4">{new Date(line.journalEntry?.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-4">{line.journalEntry?.reference} <br/><span className="text-xs text-brand-sage">{line.journalEntry?.description}</span></td>
                      <td className="p-4 text-green-400">{isDebit ? `Rp ${line.debit.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="p-4 text-red-400">{isCredit ? `Rp ${line.credit.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="p-4 text-right font-mono text-brand-warm">
                        {isDebit ? '+' : '-'}{Math.abs(line.debit - line.credit).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )
                })}
                {ledgerData.lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-brand-sage">Tidak ada transaksi pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
