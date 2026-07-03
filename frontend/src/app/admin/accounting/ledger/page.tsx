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
    if (!accountId) return alert("Select an account first!");
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
          <h1 className="text-3xl font-display font-bold text-zinc-900">General Ledger</h1>
          <p className="text-zinc-500">Transaction history per account</p>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-end bg-white border border-zinc-200 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-zinc-650 text-sm mb-1">Select Account</label>
          <select 
            className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-zinc-900 focus:outline-none focus:border-blue-500"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">-- Select Account --</option>
            {coas.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-zinc-650 text-sm mb-1">From Date</label>
          <input 
            type="date" 
            className="bg-white border border-zinc-200 rounded-lg p-2 text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-zinc-650 text-sm mb-1">To Date</label>
          <input 
            type="date" 
            className="bg-white border border-zinc-200 rounded-lg p-2 text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={fetchLedger} disabled={loading}>
          {loading ? 'Loading...' : <><Search className="w-4 h-4 mr-2" /> Search</>}
        </Button>
      </Card>

      {ledgerData && (
        <Card className="p-0 overflow-hidden border border-zinc-200 bg-white rounded-2xl shadow-sm">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-xl font-bold text-zinc-900">{ledgerData.account.code} - {ledgerData.account.name}</h2>
            <p className="text-zinc-500 text-sm">Type: {ledgerData.account.type}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Debit</th>
                  <th className="p-4">Credit</th>
                  <th className="p-4 text-right">Balance Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700 text-sm">
                {ledgerData.lines.map((line: any, i: number) => {
                  const isDebit = line.debit > 0;
                  const isCredit = line.credit > 0;
                  return (
                    <tr key={line.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-4 text-zinc-600">{new Date(line.journalEntry?.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 text-zinc-900 font-medium">
                        {line.journalEntry?.reference} 
                        <br/>
                        <span className="text-xs text-zinc-500">{line.journalEntry?.description}</span>
                      </td>
                      <td className="p-4 text-emerald-600 font-medium">{isDebit ? `Rp ${line.debit.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="p-4 text-red-600 font-medium">{isCredit ? `Rp ${line.credit.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="p-4 text-right font-mono font-bold text-blue-600">
                        {isDebit ? '+' : '-'}{Math.abs(line.debit - line.credit).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )
                })}
                {ledgerData.lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">No transactions in this period.</td>
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
