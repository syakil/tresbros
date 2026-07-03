"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function CoaPage() {
  const [coas, setCoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoas();
  }, []);

  const fetchCoas = async () => {
    try {
      const res = await axios.get('/api/accounting/coa');
      setCoas(res.data);
    } catch (error) {
      console.error("Failed to fetch COAs", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-zinc-500">Loading Chart of Accounts...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Chart of Accounts</h1>
          <p className="text-zinc-500">Manage system financial accounts</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Account Name</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700 text-sm">
              {coas.map((coa) => (
                <tr key={coa.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">{coa.code}</td>
                  <td className="p-4 text-zinc-900">{coa.name}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded text-xs font-bold">
                      {coa.type}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 rounded-lg transition-colors border border-zinc-200">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors border border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {coas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">No accounts registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
