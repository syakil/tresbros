"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function ProfitLossPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(); // fetch default (all time)
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await axios.get(`/api/accounting/profit-loss?${query.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch profit loss", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-cream">Laba Rugi (Profit & Loss)</h1>
          <p className="text-brand-sage">Laporan pendapatan bersih bisnis Anda</p>
        </div>
      </div>

      <Card className="p-4 flex gap-4 items-end bg-black/40 border border-white/5 flex-wrap">
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
        <Button variant="primary" onClick={fetchData} disabled={loading}>
          {loading ? 'Menghitung...' : <><Search className="w-4 h-4 mr-2" /> Hitung Laba Rugi</>}
        </Button>
      </Card>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-white/5">
            <h2 className="text-xl font-bold text-green-400 mb-4 border-b border-white/10 pb-2">Pendapatan (Revenue)</h2>
            <div className="space-y-3">
              {data.revenues.map((rev: any) => (
                <div key={rev.accountId} className="flex justify-between text-brand-cream text-sm">
                  <span>{rev.accountCode} - {rev.accountName}</span>
                  <span className="font-mono">Rp {rev.balance.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {data.revenues.length === 0 && <p className="text-brand-sage text-sm">Belum ada pendapatan.</p>}
              
              <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-green-400 mt-4">
                <span>Total Pendapatan</span>
                <span>Rp {data.totalRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-white/5">
            <h2 className="text-xl font-bold text-red-400 mb-4 border-b border-white/10 pb-2">Beban & HPP (Expenses)</h2>
            <div className="space-y-3">
              {data.expenses.map((exp: any) => (
                <div key={exp.accountId} className="flex justify-between text-brand-cream text-sm">
                  <span>{exp.accountCode} - {exp.accountName}</span>
                  <span className="font-mono">Rp {exp.balance.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {data.expenses.length === 0 && <p className="text-brand-sage text-sm">Belum ada beban.</p>}

              <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-red-400 mt-4">
                <span>Total Beban</span>
                <span>Rp {data.totalExpense.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </Card>

          <Card className={`p-6 border border-white/5 col-span-1 md:col-span-2 flex justify-between items-center ${data.netProfit >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
            <div>
              <h2 className="text-2xl font-bold text-brand-cream">Laba Bersih (Net Profit)</h2>
              <p className="text-brand-sage">Total Pendapatan dikurangi Total Beban</p>
            </div>
            <div className={`text-4xl font-mono font-bold ${data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Rp {data.netProfit.toLocaleString('id-ID')}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
