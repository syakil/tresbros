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
  const [editingProduct, setEditingProduct] = useState<any>(null);

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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get('/api/categories');
      return res.data;
    }
  });

  const categoryOptions = React.useMemo(() => {
    const opts = categories.map((c: any) => ({ label: c.name, value: c.name }));
    
    // Ensure standard options exist
    const standard = ['Coffee', 'Non-Coffee', 'Tea', 'Food', 'Snack', 'Uncategorized'];
    standard.forEach(s => {
      if (!opts.find((o: any) => o.value === s)) {
        opts.push({ label: s, value: s });
      }
    });

    // If editing a product with a totally custom category not in the list, add it too
    if (editingProduct && editingProduct.category && !opts.find((o: any) => o.value === editingProduct.category)) {
      opts.push({ label: editingProduct.category, value: editingProduct.category });
    }
    
    return opts;
  }, [categories, editingProduct]);

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

  const updateProduct = useMutation({
    mutationFn: async (data: any) => {
      await axios.put(`/api/products/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      showToast('Product updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update product', 'error');
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
          ${toastMessage.type === 'success' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white'}`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Konfirmasi Hapus Produk */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 flex flex-col gap-4 text-center border-0">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2 text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-zinc-900">Delete Product?</h3>
            <p className="text-sm text-zinc-500">
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
        <h1 className="text-3xl font-display font-bold text-zinc-900">Product Data</h1>
        <div className="flex justify-between items-center">
          <p className="text-zinc-500">Manage menu and prices of products sold</p>
          <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="relative z-20 flex flex-col md:flex-row gap-5 items-end bg-white border border-zinc-200 p-6 shadow-sm">
          <div className="flex-1 w-full">
            <label className="text-sm text-zinc-700 font-medium mb-1.5 block">Product Name</label>
            <input 
              type="text"
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              placeholder="e.g., Espresso" 
              className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm text-zinc-700 font-medium mb-1.5 block">Price (Rp)</label>
            <input 
              type="number"
              value={form.price} 
              onChange={(e) => setForm({...form, price: e.target.value})} 
              placeholder="15000" 
              className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm text-zinc-700 font-medium mb-1.5 block">Category</label>
            <CustomSelect 
              value={form.category}
              onChange={(val) => setForm({...form, category: val})}
              className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3"
              options={categoryOptions}
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

      <Card className="p-0 overflow-hidden overflow-x-auto shadow-sm border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm text-zinc-600 min-w-[600px]">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-5 font-bold w-16">ID</th>
              <th className="px-6 py-5 font-bold w-32">Category</th>
              <th className="px-6 py-5 font-bold">Product Name</th>
              <th className="px-6 py-5 font-bold">Price</th>
              <th className="px-6 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((p: any) => (
              <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">#{p.id}</td>
                <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide">{p.category}</span></td>
                <td className="px-6 py-4 text-zinc-900 font-medium text-base">{p.name}</td>
                <td className="px-6 py-4 font-bold text-blue-600">Rp {p.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setEditingProduct({ ...p })}
                    className="text-zinc-400 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-lg transition opacity-0 group-hover:opacity-100 mr-2"
                    title="Edit Product"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(p.id)}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-zinc-500 font-medium">
                  No products yet. Please add a new product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white shadow-xl p-6 flex flex-col gap-5 border-0">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-zinc-900">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Product Name</label>
                <Input 
                  value={editingProduct.name} 
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                  placeholder="e.g., Espresso"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Price (Rp)</label>
                <Input 
                  type="number" 
                  value={editingProduct.price} 
                  onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} 
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                <CustomSelect
                  value={editingProduct.category}
                  onChange={(val) => setEditingProduct({...editingProduct, category: val})}
                  options={categoryOptions}
                  className="bg-white border border-zinc-200 text-zinc-900 rounded-lg px-3 py-2 flex items-center h-10 w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={() => updateProduct.mutate(editingProduct)}
                disabled={!editingProduct.name || !editingProduct.price || updateProduct.isPending}
              >
                {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
