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
          <h1 className="text-3xl font-display font-bold text-zinc-900">Profit & Loss</h1>
          <p className="text-zinc-500">Your business net income report</p>
        </div>
      </div>

      <Card className="p-4 flex gap-4 items-end bg-white border border-zinc-200 shadow-sm flex-wrap">
        <div>
          <label className="block text-zinc-600 text-sm mb-1">From Date</label>
          <input 
            type="date" 
            className="bg-white border border-zinc-200 rounded-lg p-2 text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-zinc-600 text-sm mb-1">To Date</label>
          <input 
            type="date" 
            className="bg-white border border-zinc-200 rounded-lg p-2 text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={fetchData} disabled={loading}>
          {loading ? 'Calculating...' : <><Search className="w-4 h-4 mr-2" /> Calculate Profit Loss</>}
        </Button>
      </Card>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-zinc-200 bg-white shadow-sm">
            <h2 className="text-xl font-bold text-emerald-600 mb-4 border-b border-zinc-100 pb-2">Revenue</h2>
            <div className="space-y-3">
              {data.revenues.map((rev: any) => (
                <div key={rev.accountId} className="flex justify-between text-zinc-700 text-sm">
                  <span>{rev.accountCode} - {rev.accountName}</span>
                  <span className="font-mono font-medium">Rp {rev.balance.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {data.revenues.length === 0 && <p className="text-zinc-500 text-sm">No revenue yet.</p>}
              
              <div className="pt-3 border-t border-zinc-100 flex justify-between font-bold text-emerald-600 mt-4">
                <span>Total Revenue</span>
                <span>Rp {data.totalRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-zinc-200 bg-white shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-4 border-b border-zinc-100 pb-2">Expenses & COGS</h2>
            <div className="space-y-3">
              {data.expenses.map((exp: any) => (
                <div key={exp.accountId} className="flex justify-between text-zinc-700 text-sm">
                  <span>{exp.accountCode} - {exp.accountName}</span>
                  <span className="font-mono font-medium">Rp {exp.balance.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {data.expenses.length === 0 && <p className="text-zinc-500 text-sm">No expenses yet.</p>}

              <div className="pt-3 border-t border-zinc-100 flex justify-between font-bold text-red-600 mt-4">
                <span>Total Expenses</span>
                <span>Rp {data.totalExpense.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </Card>

          <Card className={`p-6 border border-zinc-200 col-span-1 md:col-span-2 flex justify-between items-center ${data.netProfit >= 0 ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Net Profit</h2>
              <p className="text-zinc-500">Total Revenue minus Total Expenses</p>
            </div>
            <div className={`text-4xl font-mono font-bold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Rp {data.netProfit.toLocaleString('id-ID')}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
