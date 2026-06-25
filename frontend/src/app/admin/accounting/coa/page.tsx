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

  if (loading) return <div className="p-6 text-brand-cream">Loading Chart of Accounts...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-cream">Chart of Accounts</h1>
          <p className="text-brand-sage">Manage system financial accounts</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-brand-sage text-sm border-b border-white/5">
              <tr>
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Account Name</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-brand-cream text-sm">
              {coas.map((coa) => (
                <tr key={coa.id} className="hover:bg-black/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-brand-warm">{coa.code}</td>
                  <td className="p-4">{coa.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-brand-sage/20 text-brand-sage rounded text-xs font-bold">
                      {coa.type}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="p-2 bg-black/40 hover:bg-brand-olive rounded-lg transition-colors border border-white/5">
                      <Edit2 className="w-4 h-4 text-brand-cream" />
                    </button>
                    <button className="p-2 bg-black/40 hover:bg-red-500/80 rounded-lg transition-colors border border-white/5">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </td>
                </tr>
              ))}
              {coas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-brand-sage">No accounts registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
