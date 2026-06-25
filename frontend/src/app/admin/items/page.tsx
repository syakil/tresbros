"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, X, CheckCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'Coffee' });

  // Custom Alert & Toast State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products');
      return res.data;
    }
  });

  const addProduct = useMutation({
    mutationFn: async (data: typeof form) => {
      await axios.post('/api/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowAdd(false);
      setForm({ name: '', price: '', category: 'Coffee' });
      showToast('Product added successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add product', 'error');
    }
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setConfirmDeleteId(null);
      showToast('Product deleted successfully', 'success');
    },
    onError: (error: any) => {
      setConfirmDeleteId(null);
      showToast(error.response?.data?.error || "Failed to delete", "error");
    }
  });

  const confirmAction = () => {
    if (confirmDeleteId) {
      deleteProduct.mutate(confirmDeleteId);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3
          ${toastMessage.type === 'success' ? 'bg-brand-olive/95 border-brand-sage/50 text-brand-cream' : 'bg-red-900/95 border-red-500/50 text-red-200'}`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Konfirmasi Hapus Produk */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card variant="olive" className="w-full max-w-md bg-[#1C1F1D] border-red-500/30 shadow-2xl p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-brand-cream">Delete Product?</h3>
            <p className="text-sm text-brand-sage">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-red-500 hover:bg-red-600 text-white border-none shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all"
                onClick={confirmAction}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-brand-cream">Product Data</h1>
        <div className="flex justify-between items-center">
          <p className="text-brand-sage">Manage menu and prices of products sold</p>
          <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card variant="olive" className="relative z-20 flex flex-col md:flex-row gap-4 items-end bg-black/40 border border-brand-warm/30">
          <div className="flex-1 w-full">
            <label className="text-xs text-brand-sage mb-1 block">Product Name</label>
            <input 
              type="text"
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              placeholder="e.g., Espresso" 
              className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs text-brand-sage mb-1 block">Price (Rp)</label>
            <input 
              type="number"
              value={form.price} 
              onChange={(e) => setForm({...form, price: e.target.value})} 
              placeholder="15000" 
              className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs text-brand-sage mb-1 block">Category</label>
            <CustomSelect 
              value={form.category}
              onChange={(val) => setForm({...form, category: val})}
              className="bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3"
              options={[
                { value: 'Coffee', label: 'Coffee' },
                { value: 'Non-Coffee', label: 'Non-Coffee' },
                { value: 'Food', label: 'Food' }
              ]}
            />
          </div>
          <Button 
            variant="primary" 
            className="py-3 w-full md:w-auto"
            onClick={() => addProduct.mutate(form)}
            disabled={!form.name || !form.price}
          >
            Save
          </Button>
        </Card>
      )}

      <Card variant="olive" className="p-0 overflow-hidden overflow-x-auto shadow-xl border-white/10">
        <table className="w-full text-left text-sm text-brand-sage min-w-[600px]">
          <thead className="bg-black/40 text-brand-cream border-b border-white/10">
            <tr>
              <th className="px-6 py-5 font-semibold w-16">ID</th>
              <th className="px-6 py-5 font-semibold w-32">Category</th>
              <th className="px-6 py-5 font-semibold">Product Name</th>
              <th className="px-6 py-5 font-semibold">Price</th>
              <th className="px-6 py-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((p: any) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">#{p.id}</td>
                <td className="px-6 py-4"><span className="bg-brand-sage/20 text-brand-cream px-3 py-1.5 rounded-md text-xs font-medium">{p.category}</span></td>
                <td className="px-6 py-4 text-brand-cream font-medium text-base">{p.name}</td>
                <td className="px-6 py-4 font-medium text-brand-warm">Rp {p.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setConfirmDeleteId(p.id)}
                    className="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 p-2.5 rounded-lg transition"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-brand-sage/50">
                  No products yet. Please add a new product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
