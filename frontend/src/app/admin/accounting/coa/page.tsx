"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function CoaPage() {
  const [coas, setCoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCoa, setSelectedCoa] = useState<any | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'ASSET' });

  const handleOpenModal = (mode: 'create' | 'edit', coa: any = null) => {
    setModalMode(mode);
    setSelectedCoa(coa);
    if (coa) {
      setFormData({ code: coa.code, name: coa.name, type: coa.type });
    } else {
      setFormData({ code: '', name: '', type: 'ASSET' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.type) {
      alert("All fields are required!");
      return;
    }
    try {
      if (modalMode === 'create') {
        await axios.post('/api/accounting/coa', formData);
      } else {
        await axios.put(`/api/accounting/coa/${selectedCoa.id}`, { ...selectedCoa, ...formData });
      }
      setShowModal(false);
      fetchCoas();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save account");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await axios.delete(`/api/accounting/coa/${id}`);
      fetchCoas();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete account");
    }
  };

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
        <Button variant="primary" onClick={() => handleOpenModal('create')}>
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
                    <button onClick={() => handleOpenModal('edit', coa)} className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 rounded-lg transition-colors border border-zinc-200">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(coa.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors border border-red-200">
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

      {/* COA Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
            <h3 className="text-xl font-bold font-display text-zinc-900">
              {modalMode === 'create' ? 'Add Account' : 'Edit Account'}
            </h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Account Code</label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. 1-100"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Account Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cash in Bank"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block">Account Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
